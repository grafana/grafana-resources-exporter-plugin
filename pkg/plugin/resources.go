package plugin

import (
	"encoding/json"
	"errors"
	"fmt"
	"io/fs"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/grafana/grizzly/pkg/grizzly"
	tfgenerate "github.com/grafana/terraform-provider-grafana/v3/pkg/generate"
	tfprovider "github.com/grafana/terraform-provider-grafana/v3/pkg/provider"
)

// registerRoutes takes a *http.ServeMux and registers some HTTP handlers.
func (a *App) registerRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/generate", a.handleGenerate)
	mux.HandleFunc("/resource-types", a.handleResourceTypes)
}

type generateRequest struct {
	Target       string `json:"target"`
	OutputFormat string `json:"outputFormat"`

	// OnlyResources is a list of patterns to filter resources by.
	// If a resource name matches any of the patterns, it will be included in the output.
	// Patterns are in the form of `resourceType.resourceName` and support * as a wildcard.
	OnlyResources []string `json:"onlyResources"`
}

type generatedFile struct {
	Name    string `json:"name"`
	Content string `json:"content"`
}

type generateResponse struct {
	Files    []generatedFile `json:"files"`
	Warnings []string        `json:"warnings,omitempty"`
}

func (a *App) handleGenerate(w http.ResponseWriter, req *http.Request) {
	if req.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	if req.Body == nil {
		http.Error(w, "empty request body", http.StatusBadRequest)
		return
	}

	var body generateRequest
	if err := json.NewDecoder(req.Body).Decode(&body); err != nil {
		a.logger.Error(err.Error())
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	tmpDir, err := os.MkdirTemp("", "generate-")
	if err != nil {
		a.logger.Error(err.Error())
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer func() {
		a.logger.Debug("deleting generate tmp directory")
		if err := os.RemoveAll(tmpDir); err != nil {
			a.logger.Error(err.Error())
		}
	}()

	var errStrings []string
	if strings.HasPrefix(body.OutputFormat, "grizzly") {
		registry := a.grizzlyRegistry()
		eventsRecorder := grizzly.NewWriterRecorder(os.Stderr, grizzly.EventToPlainText)
		if err := grizzly.Pull(registry, tmpDir, false, strings.TrimPrefix(body.OutputFormat, "grizzly-"), body.OnlyResources, true, eventsRecorder); err != nil {
			a.logger.Error(err.Error())
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	} else {
		genConfig := &tfgenerate.Config{
			TerraformInstallConfig: tfgenerate.TerraformInstallConfig{
				InstallDir: a.tfInstallDir,
			},
			OutputDir:        tmpDir,
			Clobber:          true,
			ProviderVersion:  "v3.0.0", // TODO(kgz): can we get that from the tf provider itself?
			Format:           tfgenerate.OutputFormat(strings.TrimPrefix(body.OutputFormat, "terraform-")),
			IncludeResources: body.OnlyResources,
		}
		if body.Target == "cloud" {
			genConfig.Cloud = &tfgenerate.CloudConfig{
				Org:               a.config.JSONData.CloudOrg,
				AccessPolicyToken: a.config.SecureJSONData.CloudAccessPolicyToken,
			}
		} else {
			genConfig.Grafana = &tfgenerate.GrafanaConfig{
				URL:  a.config.JSONData.GrafanaURL,
				Auth: a.config.SecureJSONData.GrafanaAuth,
			}
			if a.config.SecureJSONData.SMToken != "" {
				genConfig.Grafana.SMURL = a.config.JSONData.SMURL
				genConfig.Grafana.SMAccessToken = a.config.SecureJSONData.SMToken
			}
			if a.config.SecureJSONData.OnCallToken != "" {
				genConfig.Grafana.OnCallURL = a.config.JSONData.OnCallURL
				genConfig.Grafana.OnCallAccessToken = a.config.SecureJSONData.OnCallToken
			}
			if a.config.JSONData.GrafanaIsCloudStack {
				genConfig.Grafana.IsGrafanaCloudStack = true
			}
		}

		result := tfgenerate.Generate(req.Context(), genConfig)
		criticalErr := false
		for _, err := range result.Errors {
			a.logger.Error(fmt.Sprintf("error %s (%T)", err.Error(), err))
			// Only end the request if there are critical errors.
			if _, ok := err.(tfgenerate.NonCriticalError); !ok {
				criticalErr = true
				break
			}
			errStrings = append(errStrings, err.Error())
		}
		if criticalErr {
			http.Error(w, errors.Join(result.Errors...).Error(), http.StatusInternalServerError)
			return
		}
	}

	files, err := a.directoryToGeneratedFiles(tmpDir)
	if err != nil {
		a.logger.Error(err.Error())
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	resp := generateResponse{
		Files:    files,
		Warnings: errStrings,
	}

	w.Header().Add("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(resp); err != nil {
		a.logger.Error(err.Error())
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

type resource struct {
	Name     string `json:"name"`
	Category string `json:"category"`
}

type resourceTypesResponse struct {
	Resources []resource `json:"resources"`
}

func (a *App) handleResourceTypes(w http.ResponseWriter, req *http.Request) {
	if req.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse req query params
	outputFormat := req.URL.Query().Get("outputFormat")
	if outputFormat == "" {
		http.Error(w, "outputFormat query param is required", http.StatusBadRequest)
		return
	}

	target := req.URL.Query().Get("target")
	if outputFormat == "" {
		http.Error(w, "target query param is required", http.StatusBadRequest)
		return
	}

	var resources []resource
	if strings.HasPrefix(outputFormat, "grizzly") {
		// Grizzly
		grizzlyRegistry := a.grizzlyRegistry()
		for _, handler := range grizzlyRegistry.HandlerOrder {
			resources = append(resources, resource{Name: handler.Kind()})
		}
	} else {
		for _, r := range tfprovider.Resources() {
			if r.ListIDsFunc == nil {
				continue
			}
			// TODO: Cloud resources
			if target == "cloud" && r.Category == "Cloud" {
				resources = append(resources, resource{Name: r.Name})
			} else if target != "cloud" {
				switch string(r.Category) {
				case "Synthetic Monitoring":
					if a.config.SecureJSONData.SMToken != "" {
						resources = append(resources, resource{Name: r.Name, Category: string(r.Category)})
					}
				case "OnCall":
					if a.config.SecureJSONData.OnCallToken != "" {
						resources = append(resources, resource{Name: r.Name, Category: string(r.Category)})
					}
				case "Machine Learning", "SLO":
					if a.config.JSONData.GrafanaIsCloudStack {
						resources = append(resources, resource{Name: r.Name, Category: string(r.Category)})
					}
				case "Cloud":
					continue
				default:
					if !strings.Contains(a.config.SecureJSONData.GrafanaAuth, ":") {
						// Skip global resources, they only work with basic auth
						switch r.Name {
						case "grafana_organization", "grafana_organization_preferences", "grafana_user":
							continue
						}
					}
					resources = append(resources, resource{Name: r.Name, Category: string(r.Category)})
				}
			}
		}
	}
	sort.Slice(resources, func(i, j int) bool {
		return resources[i].Name < resources[j].Name
	})

	resp := resourceTypesResponse{
		Resources: resources,
	}

	w.Header().Add("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(resp); err != nil {
		a.logger.Error(err.Error())
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func (a *App) directoryToGeneratedFiles(directory string) ([]generatedFile, error) {
	var files []generatedFile
	err := filepath.Walk(directory, func(path string, info fs.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if info.IsDir() {
			return nil
		}

		filename := strings.TrimLeft(strings.TrimPrefix(path, directory), string(os.PathSeparator))

		if strings.HasPrefix(filename, ".terraform") {
			return nil
		}

		content, err := os.ReadFile(path)
		if err != nil {
			return err
		}

		a.logger.Info(info.Name(), filename)

		files = append(files, generatedFile{
			Name:    info.Name(),
			Content: string(content),
		})

		return nil
	})
	if err != nil {
		return nil, err
	}

	return files, nil
}
