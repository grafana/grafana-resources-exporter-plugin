package plugin

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/instancemgmt"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
	"github.com/grafana/grafana-plugin-sdk-go/backend/resource/httpadapter"
	grizzlyConfig "github.com/grafana/grizzly/pkg/config"
	grizzlyGrafana "github.com/grafana/grizzly/pkg/grafana"
	"github.com/grafana/grizzly/pkg/grizzly"
	grizzlySM "github.com/grafana/grizzly/pkg/syntheticmonitoring"
)

// Make sure App implements required interfaces. This is important to do
// since otherwise we will only get a not implemented error response from plugin in
// runtime. Plugin should not implement all these interfaces - only those which are
// required for a particular task.
var (
	_ backend.CallResourceHandler   = (*App)(nil)
	_ instancemgmt.InstanceDisposer = (*App)(nil)
	_ backend.CheckHealthHandler    = (*App)(nil)
)

type JSONData struct {
	GrafanaURL          string `json:"grafanaUrl"`
	GrafanaIsCloudStack bool   `json:"grafanaIsCloudStack"`
	SMURL               string `json:"smUrl"`
	OnCallURL           string `json:"oncallUrl"`
	CloudOrg            string `json:"cloudOrg"`
}

type EncodedSecureJSONData struct {
	ServiceAccountToken    string `json:"serviceAccountToken"`
	SMToken                string `json:"smToken"`
	OnCallToken            string `json:"oncallToken"`
	CloudAccessPolicyToken string `json:"cloudAccessPolicyToken"`
}

type Config struct {
	JSONData       JSONData              `json:"jsonData"`
	SecureJSONData EncodedSecureJSONData `json:"secureJsonData"`
}

func (config *Config) FromAppInstanceSettings(settings backend.AppInstanceSettings) error {
	if settings.JSONData != nil {
		if err := json.Unmarshal(settings.JSONData, &config.JSONData); err != nil {
			return err
		}
	}

	if settings.DecryptedSecureJSONData != nil {
		if saToken, ok := settings.DecryptedSecureJSONData["serviceAccountToken"]; ok {
			config.SecureJSONData.ServiceAccountToken = saToken
		}
		if capToken, ok := settings.DecryptedSecureJSONData["cloudAccessPolicyToken"]; ok {
			config.SecureJSONData.CloudAccessPolicyToken = capToken
		}
		if smToken, ok := settings.DecryptedSecureJSONData["smToken"]; ok {
			config.SecureJSONData.SMToken = smToken
		}
		if ocToken, ok := settings.DecryptedSecureJSONData["oncallToken"]; ok {
			config.SecureJSONData.OnCallToken = ocToken
		}
	}

	return nil
}

// App is an example app backend plugin which can respond to data queries.
type App struct {
	backend.CallResourceHandler

	config *Config
	logger log.Logger
}

// NewApp creates a new example *App instance.
func NewApp(_ context.Context, appInstanceSettings backend.AppInstanceSettings) (instancemgmt.Instance, error) {
	app := App{
		config: &Config{},
		logger: log.New(),
	}

	if err := app.config.FromAppInstanceSettings(appInstanceSettings); err != nil {
		return nil, err
	}

	// Use a httpadapter (provided by the SDK) for resource calls. This allows us
	// to use a *http.ServeMux for resource calls, so we can map multiple routes
	// to CallResource without having to implement extra logic.
	mux := http.NewServeMux()
	app.registerRoutes(mux)
	app.CallResourceHandler = httpadapter.New(mux)

	return &app, nil
}

// Dispose here tells plugin SDK that plugin wants to clean up resources when a new instance
// created.
func (a *App) Dispose() {
	// cleanup
}

// CheckHealth handles health checks sent from Grafana to the plugin.
func (a *App) CheckHealth(_ context.Context, _ *backend.CheckHealthRequest) (*backend.CheckHealthResult, error) {
	return &backend.CheckHealthResult{
		Status:  backend.HealthStatusOk,
		Message: "ok",
	}, nil
}

func (a *App) grizzlyRegistry() grizzly.Registry {
	grafanaProvider := grizzlyGrafana.NewProvider(&grizzlyConfig.GrafanaConfig{
		URL:   a.config.JSONData.GrafanaURL,
		Token: a.config.SecureJSONData.ServiceAccountToken,
	})
	providers := []grizzly.Provider{grafanaProvider}
	if a.config.SecureJSONData.SMToken != "" {
		providers = append(providers, grizzlySM.NewProvider(&grizzlyConfig.SyntheticMonitoringConfig{
			URL:   a.config.JSONData.SMURL,
			Token: a.config.SecureJSONData.SMToken,
		}))
	}
	return grizzly.NewRegistry(providers)
}
