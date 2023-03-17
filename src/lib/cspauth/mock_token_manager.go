package cspauth

import (
	"context"
	"github.com/pkg/errors"
)

var (
	DummyAccessToken = "dummy-access-token"
	SendError        = "send-error"
)

// MockCSPClient is a mock of the CSPClient interface
type MockCSPClient struct {
}

// NewMockCSPClient creates a new mock instance
func NewMockCSPClient() *MockCSPClient {
	return &MockCSPClient{}
}

func (m *MockCSPClient) GetCspAuthorization(ctx context.Context, apiToken string) (*CSPAuthorizeResponse, error) {
	if apiToken == SendError {
		return nil, errors.New("Failed to get CSP Auth")
	}
	response := CSPAuthorizeResponse{}
	response.AccessToken = DummyAccessToken
	response.ExpiresIn = 1000
	return &response, nil
}
