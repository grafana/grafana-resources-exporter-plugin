package plugin

import (
	"encoding/json"
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
	Files []generatedFile `json:"files"`
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
				Auth: a.config.SecureJSONData.ServiceAccountToken,
			}
		}

		if err := tfgenerate.Generate(req.Context(), genConfig); err != nil {
			a.logger.Error(err.Error())
			http.Error(w, err.Error(), http.StatusInternalServerError)
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
		Files: files,
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
	Name string `json:"name"`
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
				case "Cloud", "Machine Learning", "OnCall", "SLO", "Synthetic Monitoring":
					continue
				default:
					resources = append(resources, resource{Name: r.Name})
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
