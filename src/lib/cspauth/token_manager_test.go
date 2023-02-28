package cspauth

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
)

func TestGetCspAuthorization(t *testing.T) {
	tt := []struct {
		name    string
		token   string
		wantErr bool
	}{
		{
			name:    "Get CSP Auth Success",
			token:   "dummy-api-token",
			wantErr: false,
		},
		{
			name:    "Get CSP Auth Failure",
			token:   "dummy-api-error-token",
			wantErr: true,
		},
	}

	for i := range tt {
		tc := tt[i]

		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()

			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				body, _ := io.ReadAll(r.Body)
				bodyStr := string(body)
				if strings.Contains(bodyStr, "refresh_token=dummy-api-token") {
					var cspAuthResponse CSPAuthorizeResponse
					cspAuthResponse.AccessToken = "dummy-access-token"
					successResponse, _ := json.Marshal(cspAuthResponse)
					_, _ = w.Write(successResponse)
					w.WriteHeader(http.StatusOK)
				} else {
					w.WriteHeader(http.StatusBadGateway)
				}
			}))

			defer server.Close()

			client, _ := NewCspHTTPClient()
			client.client = http.DefaultClient
			client.host, _ = url.Parse(server.URL)
			apiToken := tc.token
			authorization, err := client.GetCspAuthorization(context.Background(), apiToken)

			if tc.wantErr && (authorization != nil || err == nil) {
				t.Fatalf("GetCspAuthorizationCase must fail but got success with token: %v", authorization)
			}

			if !tc.wantErr && (authorization == nil || err != nil) {
				t.Fatalf("GetCspAuthorizationCase should not fail but failed with error: %v", err)
			}
		})
	}

}
