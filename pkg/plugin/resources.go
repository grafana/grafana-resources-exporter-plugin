package plugin

import (
	"encoding/json"
	"io/fs"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
	tfgenerate "github.com/grafana/terraform-provider-grafana/v2/pkg/generate"
)

// registerRoutes takes a *http.ServeMux and registers some HTTP handlers.
func (a *App) registerRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/generate", a.handleGenerate)
}

type generateRequest struct {
	OutputFormat tfgenerate.OutputFormat   `json:"outputFormat"`
	Grafana      *tfgenerate.GrafanaConfig `json:"grafana"`
	Cloud        *tfgenerate.CloudConfig   `json:"cloud"`
}

type generateResponse struct {
	Files map[string]string `json:"files"`
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
		log.DefaultLogger.Error(err.Error())
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	tmpDir, err := os.MkdirTemp("", "tf-generate-")
	if err != nil {
		log.DefaultLogger.Error(err.Error())
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer func() {
		log.DefaultLogger.Debug("deleting tf-generate tmp directory")
		if err := os.RemoveAll(tmpDir); err != nil {
			log.DefaultLogger.Error(err.Error())
		}
	}()

	genConfig := &tfgenerate.Config{
		OutputDir:       tmpDir,
		Clobber:         true,
		Format:          body.OutputFormat,
		ProviderVersion: "v3.0.0", // TODO(kgz): can we get that from the tf provider itself?
		Grafana: &tfgenerate.GrafanaConfig{
			URL:  "http://127.0.0.1:3000", // TODO(kgz)
			Auth: "",                      // TODO(kgz)
		},
		//Cloud: &tfgenerate.CloudConfig{},
	}

	if err := tfgenerate.Generate(req.Context(), genConfig); err != nil {
		log.DefaultLogger.Error(err.Error())
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	directoryContent, err := directoryToMap(tmpDir)
	if err != nil {
		log.DefaultLogger.Error(err.Error())
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	resp := generateResponse{
		Files: directoryContent,
	}

	w.Header().Add("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(resp); err != nil {
		log.DefaultLogger.Error(err.Error())
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func directoryToMap(directory string) (map[string]string, error) {
	files := make(map[string]string)
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

		log.DefaultLogger.Info(info.Name(), filename)

		files[info.Name()] = string(content)

		return nil
	})
	if err != nil {
		return nil, err
	}

	return files, nil
}
