package plugin

import (
	"encoding/json"
	"io/fs"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	tfgenerate "github.com/grafana/terraform-provider-grafana/v3/pkg/generate"
	tfprovider "github.com/grafana/terraform-provider-grafana/v3/pkg/provider"
)

// registerRoutes takes a *http.ServeMux and registers some HTTP handlers.
func (a *App) registerRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/generate", a.handleGenerate)
	mux.HandleFunc("/resource-types", a.handleResourceTypes)
}

type generateRequest struct {
	OutputFormat tfgenerate.OutputFormat   `json:"outputFormat"`
	Grafana      *tfgenerate.GrafanaConfig `json:"grafana"`
	Cloud        *tfgenerate.CloudConfig   `json:"cloud"`
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

	tmpDir, err := os.MkdirTemp("", "tf-generate-")
	if err != nil {
		a.logger.Error(err.Error())
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer func() {
		a.logger.Debug("deleting tf-generate tmp directory")
		if err := os.RemoveAll(tmpDir); err != nil {
			a.logger.Error(err.Error())
		}
	}()

	genConfig := &tfgenerate.Config{
		OutputDir:       tmpDir,
		Clobber:         true,
		Format:          body.OutputFormat,
		ProviderVersion: "v3.0.0", // TODO(kgz): can we get that from the tf provider itself?
		Grafana: &tfgenerate.GrafanaConfig{
			URL:  a.config.JSONData.GrafanaURL,
			Auth: a.config.SecureJSONData.ServiceAccountToken,
		},
		// Cloud: &tfgenerate.CloudConfig{},
	}

	if err := tfgenerate.Generate(req.Context(), genConfig); err != nil {
		a.logger.Error(err.Error())
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
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
	Name      string `json:"name"`
	HasLister bool   `json:"hasLister"`
}

type resourceTypesResponse struct {
	Resources []resource `json:"resources"`
}

func (a *App) handleResourceTypes(w http.ResponseWriter, req *http.Request) {
	if req.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var resources []resource
	for _, r := range tfprovider.Resources() {
		resources = append(resources, resource{
			Name:      r.Name,
			HasLister: r.ListIDsFunc != nil,
		})
	}

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
