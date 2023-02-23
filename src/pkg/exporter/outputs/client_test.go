package outputs

import (
	"bytes"
	"crypto/rand"
	"crypto/rsa"
	"crypto/tls"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/base64"
	"encoding/pem"
	"errors"
	"github.com/stretchr/testify/require"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/pkg/exporter/types"
	"math/big"
	"net"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"strings"
	"testing"
	"time"
)

func TestNewClient(t *testing.T) {
	u, _ := url.Parse("http://localhost")
	config := &types.Configuration{}
	testClientOutput := Client{
		EndpointURL:      u,
		MutualTLSEnabled: false,
		CheckCert:        true,
		HeaderList:       []Header{},
		ContentType:      "application/json; charset=utf-8",
		Config:           config,
	}
	_, err := NewClient("hellokitty", false, true, config)
	require.NotNil(t, err)

	nc, err := NewClient("http://localhost", false, true, config)
	require.Nil(t, err)
	require.Equal(t, &testClientOutput, nc)
}

func TestPost(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "POST" {
			t.Fatalf("expected method : POST, got %s\n", r.Method)
		}
		switch r.URL.EscapedPath() {
		case "/200":
			w.WriteHeader(http.StatusOK)
		case "/400":
			w.WriteHeader(http.StatusBadRequest)
		}
	}))

	for i, j := range map[string]error{
		"/200": nil,
		"/400": errors.New("400 Bad Request"),
	} {
		nc, err := NewClient(ts.URL+i, false, true, &types.Configuration{})
		require.Nil(t, err)
		require.NotEmpty(t, nc)

		errPost := nc.Post("")
		require.Equal(t, errPost, j)
	}
}

func TestAddHeader(t *testing.T) {
	headerKey, headerVal := "key", "val"
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		passedVal := r.Header.Get(headerKey)
		require.Equal(t, passedVal, headerVal)
	}))
	nc, err := NewClient(ts.URL, false, true, &types.Configuration{})
	require.Nil(t, err)
	require.NotEmpty(t, nc)

	nc.AddHeader(headerKey, headerVal)
	nc.Post("")
}

func TestAddBasicAuth(t *testing.T) {
	username, password := "user", "pass"
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		passedVal := r.Header.Get("Authorization")
		if passedVal == "" {
			t.Fatalf("input Authorization header was empty")
		}

		splitVal := strings.Split(passedVal, " ")

		if len(splitVal) != 2 {
			t.Fatalf("basic Authorization header value must be able to be split by a space into \"Basic\" and a digest")
		}

		basicDeclarator := splitVal[0]
		digest := splitVal[1]

		require.Equal(t, basicDeclarator, "Basic")

		decodedDigestBytes, err := base64.StdEncoding.DecodeString(digest)
		require.Nil(t, err)
		decodedDigest := string(decodedDigestBytes)

		splitDigest := strings.Split(decodedDigest, ":")

		if len(splitDigest) != 2 {
			t.Fatalf("decoded digest split on a colon must have two elements - user and password.")
		}

		passedUsername := splitDigest[0]
		passedPassword := splitDigest[1]

		require.Equal(t, passedUsername, username)
		require.Equal(t, passedPassword, password)
		require.Equal(t, digest, "dXNlcjpwYXNz")
	}))
	nc, err := NewClient(ts.URL, false, true, &types.Configuration{})
	require.Nil(t, err)
	require.NotEmpty(t, nc)

	nc.BasicAuth(username, password)

	nc.Post("")
}

func TestMutualTlsPost(t *testing.T) {
	config := &types.Configuration{}

	serverTLSConf, err := certSetup(config)
	if err != nil {
		require.Nil(t, err)
	}

	tlsURL := "127.0.0.1:5443"

	// set up the httptest.Server using our certificate signed by our CA
	server := httptest.NewUnstartedServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "POST" {
			t.Fatalf("expected method : POST, got %s\n", r.Method)
		}
		if r.URL.EscapedPath() == "/200" {
			w.WriteHeader(http.StatusOK)
		}
	}))
	l, _ := net.Listen("tcp", tlsURL)
	server.Listener = l
	server.TLS = serverTLSConf
	server.StartTLS()
	defer server.Close()

	nc, err := NewClient(server.URL+"/200", true, true, config)
	require.Nil(t, err)
	require.NotEmpty(t, nc)

	errPost := nc.Post("")
	require.Nil(t, errPost)
	os.RemoveAll(MutualTLSFilesPath)
}

func certSetup(config *types.Configuration) (serverTLSConf *tls.Config, err error) {
	// delete folder to avoid makedir failure
	os.RemoveAll(MutualTLSFilesPath)
	err = os.Mkdir(MutualTLSFilesPath, 0755)
	if err != nil {
		return nil, err
	}

	// set up our CA certificate
	ca := &x509.Certificate{
		SerialNumber: big.NewInt(2022),
		Subject: pkix.Name{
			Organization:  []string{"VMware"},
			Country:       []string{"US"},
			Province:      []string{""},
			Locality:      []string{"Palo Alto"},
			StreetAddress: []string{"3401 Hillview Ave"},
			PostalCode:    []string{"94304"},
		},
		NotBefore:             time.Now(),
		NotAfter:              time.Now().AddDate(10, 0, 0),
		IsCA:                  true,
		ExtKeyUsage:           []x509.ExtKeyUsage{x509.ExtKeyUsageClientAuth, x509.ExtKeyUsageServerAuth},
		KeyUsage:              x509.KeyUsageDigitalSignature | x509.KeyUsageCertSign,
		BasicConstraintsValid: true,
	}

	// create our private and public key
	caPrivKey, err := rsa.GenerateKey(rand.Reader, 4096)
	if err != nil {
		return nil, err
	}

	// create the CA
	caBytes, err := x509.CreateCertificate(rand.Reader, ca, ca, &caPrivKey.PublicKey, caPrivKey)
	if err != nil {
		return nil, err
	}

	// pem encode
	caPEM := new(bytes.Buffer)
	pem.Encode(caPEM, &pem.Block{
		Type:  "CERTIFICATE",
		Bytes: caBytes,
	})

	// save ca to ca.crt file (it will be used by Client)
	err = os.WriteFile(MutualTLSFilesPath+"/ca.crt", caPEM.Bytes(), 0600)
	if err != nil {
		return nil, err
	}

	// set up our server certificate
	cert := &x509.Certificate{
		SerialNumber: big.NewInt(2019),
		Subject: pkix.Name{
			Organization:  []string{"VMware"},
			Country:       []string{"US"},
			Province:      []string{""},
			Locality:      []string{"Palo Alto"},
			StreetAddress: []string{"3401 Hillview Ave"},
			PostalCode:    []string{"94304"},
		},
		IPAddresses:  []net.IP{net.IPv4(127, 0, 0, 1), net.IPv6loopback},
		NotBefore:    time.Now(),
		NotAfter:     time.Now().AddDate(10, 0, 0),
		SubjectKeyId: []byte{1, 2, 3, 4, 6},
		ExtKeyUsage:  []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth},
		KeyUsage:     x509.KeyUsageDigitalSignature,
	}

	// create server private key
	certPrivKey, err := rsa.GenerateKey(rand.Reader, 4096)
	if err != nil {
		return nil, err
	}

	// sign server certificate with CA key
	certBytes, err := x509.CreateCertificate(rand.Reader, cert, ca, &certPrivKey.PublicKey, caPrivKey)
	if err != nil {
		return nil, err
	}

	certPEM := new(bytes.Buffer)
	pem.Encode(certPEM, &pem.Block{
		Type:  "CERTIFICATE",
		Bytes: certBytes,
	})

	certPrivKeyPEM := new(bytes.Buffer)
	pem.Encode(certPrivKeyPEM, &pem.Block{
		Type:  "RSA PRIVATE KEY",
		Bytes: x509.MarshalPKCS1PrivateKey(certPrivKey),
	})
	serverCert, err := tls.X509KeyPair(certPEM.Bytes(), certPrivKeyPEM.Bytes())
	if err != nil {
		return nil, err
	}

	// create server TLS config
	caCertPool := x509.NewCertPool()
	caCertPool.AppendCertsFromPEM(caPEM.Bytes())
	serverTLSConf = &tls.Config{
		Certificates: []tls.Certificate{serverCert},
		ClientCAs:    caCertPool,
		RootCAs:      caCertPool,
		ClientAuth:   tls.RequireAndVerifyClientCert,
		MinVersion:   tls.VersionTLS12,
	}

	// create client certificate
	clientCert := &x509.Certificate{
		SerialNumber: big.NewInt(2019),
		Subject: pkix.Name{
			Organization:  []string{"VMware"},
			Country:       []string{"US"},
			Province:      []string{""},
			Locality:      []string{"Palo Alto"},
			StreetAddress: []string{"3401 Hillview Ave"},
			PostalCode:    []string{"94304"},
		},
		NotBefore:    time.Now(),
		NotAfter:     time.Now().AddDate(10, 0, 0),
		SubjectKeyId: []byte{1, 2, 3, 4, 6},
		ExtKeyUsage:  []x509.ExtKeyUsage{x509.ExtKeyUsageClientAuth},
		KeyUsage:     x509.KeyUsageDigitalSignature,
	}

	// create client private key
	clientCertPrivKey, err := rsa.GenerateKey(rand.Reader, 4096)
	if err != nil {
		return nil, err
	}

	// sign client certificate with CA key
	clientCertBytes, err := x509.CreateCertificate(rand.Reader, clientCert, ca, &clientCertPrivKey.PublicKey, caPrivKey)
	if err != nil {
		return nil, err
	}

	clientCertPEM := new(bytes.Buffer)
	pem.Encode(clientCertPEM, &pem.Block{
		Type:  "CERTIFICATE",
		Bytes: clientCertBytes,
	})

	// save client cert and key to client.crt and client.key
	err = os.WriteFile(MutualTLSFilesPath+"/client.crt", clientCertPEM.Bytes(), 0600)
	if err != nil {
		return nil, err
	}
	clientCertPrivKeyPEM := new(bytes.Buffer)
	pem.Encode(clientCertPrivKeyPEM, &pem.Block{
		Type:  "RSA PRIVATE KEY",
		Bytes: x509.MarshalPKCS1PrivateKey(clientCertPrivKey),
	})
	err = os.WriteFile(MutualTLSFilesPath+"/client.key", clientCertPrivKeyPEM.Bytes(), 0600)
	if err != nil {
		return nil, err
	}
	return serverTLSConf, nil
}
