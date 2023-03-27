package cspauth

import (
	"context"
	v12 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/client-go/kubernetes/fake"
	"testing"
)

const (
	ApiToken               = "API_TOKEN"
	GovernorAccessTokenKey = "governorAccessToken"
)

func TestNewCSPAuthSuccessCase(t *testing.T) {

	RetryDelay = 1
	secret := &v12.Secret{}
	secret.Name = "csp-secret"
	secret.Namespace = "csp-namespace"
	secret.Data = map[string][]byte{ApiToken: []byte("test-api-token")}

	errorSecret := &v12.Secret{}
	errorSecret.Name = "csp-secret"
	errorSecret.Namespace = "csp-namespace"
	errorSecret.Data = map[string][]byte{ApiToken: []byte(SendError)}

	accessSecret := &v12.Secret{}
	accessSecret.Name = "governor-accesstoken"
	accessSecret.Namespace = "csp-namespace"
	accessSecret.Data = map[string][]byte{GovernorAccessTokenKey: []byte("test-access-token")}

	tt := []struct {
		name         string
		secretObject *v12.Secret
		accessSecret *v12.Secret
		wantErr      bool
	}{
		{
			name:         "Get CSP Auth should Pass",
			secretObject: secret,
			accessSecret: accessSecret,
			wantErr:      false,
		},
		{
			name:         "Get CSP Auth should fail because no secret found for csp api-token",
			secretObject: nil,
			accessSecret: accessSecret,
			wantErr:      true,
		},
		{
			name:         "Get CSP Auth should fail with giving up refresh retry(3times)",
			secretObject: errorSecret,
			accessSecret: accessSecret,
			wantErr:      true,
		},
		{
			name:         "Get CSP Auth should pass with accessSecret not found",
			secretObject: secret,
			accessSecret: nil,
			wantErr:      false,
		},
	}

	for i := range tt {
		tc := tt[i]

		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()

			objects := make([]runtime.Object, 0)

			if tc.secretObject != nil {
				objects = append(objects, tc.secretObject)
			}
			if tc.accessSecret != nil {
				objects = append(objects, tc.accessSecret)
			}
			clientSet := fake.NewSimpleClientset(objects...)

			tokenManager := NewMockCSPClient()
			provider := &CspAuth{CspClient: tokenManager}
			auth, err := provider.GetBearerToken(clientSet, context.Background(), secret.Namespace, secret.Name)

			if tc.wantErr && (auth != "" || err == nil) {
				t.Fatal("NewCSPAuth call failed on tc: " + tc.name)
			}

			if !tc.wantErr && (auth == "" || err != nil) {
				t.Fatal("NewCSPAuth call failed on tc: " + tc.name)
			}
		})
	}

}

func TestGetBearerTokenSuccess(t *testing.T) {
	secret := &v12.Secret{}
	secret.Name = "csp-secret"
	secret.Namespace = "csp-namespace"
	secret.Data = map[string][]byte{ApiToken: []byte("test-api-token")}

	clientSet := fake.NewSimpleClientset(secret)

	tokenManager := NewMockCSPClient()
	provider := &CspAuth{CspClient: tokenManager}
	authToken, _ := provider.GetBearerToken(clientSet, context.Background(), secret.Namespace, secret.Name)

	if authToken != DummyAccessToken {
		t.Fatal("GetBearer must not fail in this test case!")
	}
}

func TestGetBearerTokenReturnSameTokenSuccess(t *testing.T) {
	secret := &v12.Secret{}
	secret.Name = "csp-secret"
	secret.Namespace = "csp-namespace"
	secret.Data = map[string][]byte{ApiToken: []byte("test-api-token")}

	clientSet := fake.NewSimpleClientset(secret)

	tokenManager := NewMockCSPClient()
	provider := &CspAuth{CspClient: tokenManager}
	authToken, _ := provider.GetBearerToken(clientSet, context.Background(), secret.Namespace, secret.Name)

	if authToken != DummyAccessToken {
		t.Fatal("GetBearer must not fail in this test case!")
	}

	tokenPrev := DummyAccessToken
	DummyAccessToken = "changed-dummy-access-token"
	authToken1, _ := provider.GetBearerToken(clientSet, context.Background(), secret.Namespace, secret.Name)

	if authToken != authToken1 {
		t.Fatal("GetBearer must return same token if called consequently, \nAuth1: " + authToken + "\n Auth2: " + authToken1)
	}
	DummyAccessToken = tokenPrev
}
