package plugin

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"
	"testing"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// mockCallResourceResponseSender implements backend.CallResourceResponseSender
// for use in tests.
type mockCallResourceResponseSender struct {
	response *backend.CallResourceResponse
}

// Send sets the received *backend.CallResourceResponse to s.response
func (s *mockCallResourceResponseSender) Send(response *backend.CallResourceResponse) error {
	s.response = response
	return nil
}

// TestCallResource tests CallResource calls, using backend.CallResourceRequest and backend.CallResourceResponse.
// This ensures the httpadapter for CallResource works correctly.
func TestCallResource(t *testing.T) {
	// Initialize app
	inst, err := NewApp(context.Background(), backend.AppInstanceSettings{})
	require.NoError(t, err)
	app, ok := inst.(*App)
	require.True(t, ok, "inst must be of type *App")

	// Set up and run test cases
	for _, tc := range []struct {
		name string

		method string
		path   string
		body   []byte

		jsonData       JSONData
		secureJSONData EncodedSecureJSONData

		expStatus int
		bodyCheck func(t *testing.T, body string)
	}{
		{
			name:      "get resource types without query",
			method:    http.MethodGet,
			path:      "resource-types",
			expStatus: http.StatusBadRequest,
			bodyCheck: func(t *testing.T, body string) {
				assert.Equal(t, body, "outputFormat query param is required")
			},
		},
		{
			name:      "get resource types with basic auth",
			method:    http.MethodGet,
			path:      "resource-types?outputFormat=terraform-hcl",
			expStatus: http.StatusOK,
			secureJSONData: EncodedSecureJSONData{
				GrafanaAuth: "user:pass",
			},
			bodyCheck: func(t *testing.T, body string) {
				var resp resourceTypesResponse
				err := json.Unmarshal([]byte(body), &resp)
				require.NoError(t, err)

				assert.Greater(t, len(resp.Resources), 1)
				assert.Contains(t, body, "grafana_organization")
			},
		},
		{
			name:      "get resource types with Terraform output format",
			method:    http.MethodGet,
			path:      "resource-types?outputFormat=terraform-hcl",
			expStatus: http.StatusOK,
			secureJSONData: EncodedSecureJSONData{
				GrafanaAuth: "mysatoken",
			},
			bodyCheck: func(t *testing.T, body string) {
				var resp resourceTypesResponse
				err := json.Unmarshal([]byte(body), &resp)
				require.NoError(t, err)

				assert.Greater(t, len(resp.Resources), 1)
				// Can't manage an org with a token. Needs basic auth
				assert.NotContains(t, body, "grafana_organization")
				// These resources need more creds
				assert.NotContains(t, body, "grafana_oncall_")
				assert.NotContains(t, body, "grafana_synthetic_monitoring_")
				assert.NotContains(t, body, "grafana_machine_learning_")
				assert.NotContains(t, body, "grafana_slo_")
			},
		},
		{
			name:      "get resource types with SM token",
			method:    http.MethodGet,
			path:      "resource-types?outputFormat=terraform-hcl",
			expStatus: http.StatusOK,
			secureJSONData: EncodedSecureJSONData{
				SMToken: "sm-token",
			},
			bodyCheck: func(t *testing.T, body string) {
				assert.Contains(t, body, "grafana_synthetic_monitoring_")
			},
		},
		{
			name:      "get resource types with OnCall token",
			method:    http.MethodGet,
			path:      "resource-types?outputFormat=terraform-hcl",
			expStatus: http.StatusOK,
			secureJSONData: EncodedSecureJSONData{
				OnCallToken: "oncall-token",
			},
			bodyCheck: func(t *testing.T, body string) {
				assert.Contains(t, body, "grafana_oncall_")
			},
		},
		{
			name:      "get resource types with cloud stack",
			method:    http.MethodGet,
			path:      "resource-types?outputFormat=terraform-hcl",
			expStatus: http.StatusOK,
			jsonData: JSONData{
				GrafanaIsCloudStack: true,
			},
			bodyCheck: func(t *testing.T, body string) {
				assert.Contains(t, body, "grafana_machine_learning_")
				assert.Contains(t, body, "grafana_slo")
			},
		},
	} {
		t.Run(tc.name, func(t *testing.T) {
			app.config.JSONData = tc.jsonData
			app.config.SecureJSONData = tc.secureJSONData

			// Request by calling CallResource. This tests the httpadapter.
			var r mockCallResourceResponseSender
			err = app.CallResource(context.Background(), &backend.CallResourceRequest{
				Method: tc.method,
				Path:   tc.path,
				Body:   tc.body,
			}, &r)
			require.NoError(t, err)
			require.NotNil(t, r.response)

			assert.Equal(t, tc.expStatus, r.response.Status)

			body := strings.TrimSpace(string(r.response.Body))
			if tc.bodyCheck != nil {
				tc.bodyCheck(t, body)
			}
		})
	}
}
