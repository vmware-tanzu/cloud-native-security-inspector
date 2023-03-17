package cspauth

import (
	"context"
	"encoding/json"
	"errors"
	"github.com/goharbor/harbor/src/lib/log"
	"io"
	"net/http"
	"net/url"
	"strings"
)

var (
	ErrorCspForbidden            = errors.New("forbidden")
	ErrorCspUnauthorized         = errors.New("unauthorized")
	ErrorCspBadRequest           = errors.New("invalid api_token, it might be expired")
	ErrorRefreshTokenNotValid    = errors.New("refresh_token cannot be empty")
	UnexpectedResponseStatusCode = errors.New("unexpected csp error")
)

const (
	cspUrl = "https://console.cloud.vmware.com/csp/gateway/am/api/auth/api-tokens/authorize"
)

// CSPClient represents a CSPClient place here for future mocking purposes
// Will contain all methods related to calls directly to CSP.
// Please note this is not usual since it would be TAC the one
// talking with CSP.
type CSPClient interface {
	GetCspAuthorization(ctx context.Context, refreshToken string) (*CSPAuthorizeResponse, error)
}

// CSPHttpClient is the client to perform talks to CSP.
type CSPHttpClient struct {
	client *http.Client
	host   *url.URL
}

// CSPAuthorizeResponse represents a response from CSP with information
// about the authorization. AccessToken is the value needed to
// perform valid calls to TAC backend.
type CSPAuthorizeResponse struct {
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int    `json:"expires_in"`
	AccessToken  string `json:"access_token"`
	Scope        string `json:"scope"`
	IDToken      string `json:"id_token"`
	TokenType    string `json:"token_type"`
}

// NewCspHTTPClient creates a new CSPHttpClient
func NewCspHTTPClient() (*CSPHttpClient, error) {

	parsedURL, err := url.Parse(cspUrl)
	return &CSPHttpClient{
		client: http.DefaultClient,
		host:   parsedURL,
	}, err
}

// GetCspAuthorization connects to CSP to retrieve information regarding the given API token
func (c *CSPHttpClient) GetCspAuthorization(ctx context.Context, apiToken string) (*CSPAuthorizeResponse, error) {
	if apiToken == "" {
		return nil, ErrorRefreshTokenNotValid
	}
	values := url.Values{"grant_type": {"refresh_token"}, "refresh_token": {apiToken}}

	req, err := http.NewRequestWithContext(ctx, "POST", c.host.String(), strings.NewReader(values.Encode()))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("accept-encoding", "application/json")

	resp, err := c.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer func(Body io.ReadCloser) {
		err := Body.Close()
		if err != nil {
			return
		}
	}(resp.Body)

	if err := c.checkCspAuthStatusCode(resp); err != nil {
		log.Errorf("Found an error code: %v", err.Error())
		return nil, err
	}

	var cspAuthResponse CSPAuthorizeResponse
	return &cspAuthResponse, json.NewDecoder(resp.Body).Decode(&cspAuthResponse)
}

// Checks the status code for the auth service.
// 400 status code is ambiguous because it can mean:
// - The api_token is wrong
// - The api_token is expired
// In the later case the user would need to generate a new from
// CSP console since, expired tokens are automatically removed from
// CSP.
func (c *CSPHttpClient) checkCspAuthStatusCode(resp *http.Response) error {
	switch resp.StatusCode {
	case http.StatusOK:
		return nil
	case http.StatusBadRequest:
		// api_token can be expired
		return ErrorCspBadRequest
	case http.StatusUnauthorized:
		return ErrorCspUnauthorized
	case http.StatusForbidden:
		return ErrorCspForbidden
	default:
		return UnexpectedResponseStatusCode
	}
}
