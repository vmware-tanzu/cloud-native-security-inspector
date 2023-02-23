package outputs

import (
	"crypto/tls"
	"crypto/x509"
	"encoding/base64"
	"errors"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/lib/log"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/pkg/exporter/types"
	"io"
	"net/http"
	"net/url"
	"os"
	"regexp"
	"strings"
)

// ErrClientCreation is returned if client can't be created
var ErrClientCreation = errors.New("client creation error")

const (
	DefaultContentType          = "application/json; charset=utf-8"
	ContentTypeHeaderKey        = "Content-Type"
	AuthorizationHeaderKey      = "Authorization"
	UserAgentHeaderKey          = "User-Agent"
	UserAgentHeaderValue        = "Narrows"
	MutualTLSFilesPath          = "/tmp/NarrowsTlsFiles"
	MutualTLSClientCertFilename = "/client.crt"
	MutualTLSClientKeyFilename  = "/client.key"
	MutualTLSCaCertFilename     = "/ca.crt"
)

// Header to add to the client before sending the request
type Header struct {
	Key   string
	Value string
}

// Client communicates with the different API.
type Client struct {
	EndpointURL      *url.URL
	MutualTLSEnabled bool
	CheckCert        bool
	HeaderList       []Header
	ContentType      string
	Config           *types.Configuration
}

// NewClient returns a new output.Client
func NewClient(defaultEndpointURL string, mutualTLSEnabled bool, checkCert bool, config *types.Configuration) (*Client, error) {
	reg := regexp.MustCompile(`(http|nats)(s?)://.*`)
	if !reg.MatchString(defaultEndpointURL) {
		log.Error("bad endpoint")
		return nil, ErrClientCreation
	}
	endpointURL, err := url.Parse(defaultEndpointURL)
	if err != nil {
		log.Errorf("failed to parse the endpoint url %s", defaultEndpointURL)
		return nil, ErrClientCreation
	}
	return &Client{
		EndpointURL:      endpointURL,
		MutualTLSEnabled: mutualTLSEnabled,
		CheckCert:        checkCert,
		HeaderList:       []Header{},
		ContentType:      DefaultContentType,
		Config:           config}, nil
}

// Post sends payload by the client object
func (c *Client) Post(payload string) error {
	// defer + recover to catch panic if the consumer doesn't respond
	defer func() {
		if err := recover(); err != nil {
			log.Errorf("the consumer doesn't respond, client details: %v, error: %v", c, err)
		}
	}()

	body := strings.NewReader(payload)
	customTransport := http.DefaultTransport.(*http.Transport).Clone()

	if c.MutualTLSEnabled {
		// Load client cert
		cert, err := tls.LoadX509KeyPair(MutualTLSFilesPath+MutualTLSClientCertFilename, MutualTLSFilesPath+MutualTLSClientKeyFilename)
		if err != nil {
			log.Errorf("failed to load the x509 key pair %s", err.Error())
		}

		// Load CA cert
		caCert, err := os.ReadFile(MutualTLSFilesPath + MutualTLSCaCertFilename)
		if err != nil {
			log.Errorf("failed to load the ca cert %s", err.Error())
		}
		caCertPool := x509.NewCertPool()
		caCertPool.AppendCertsFromPEM(caCert)
		customTransport.TLSClientConfig = &tls.Config{
			Certificates: []tls.Certificate{cert},
			RootCAs:      caCertPool,
			MinVersion:   tls.VersionTLS12,
		}
	} else {
		if !c.CheckCert {
			customTransport.TLSClientConfig = &tls.Config{
				InsecureSkipVerify: true,
			}
		}
	}
	client := &http.Client{
		Transport: customTransport,
	}

	req, err := http.NewRequest("POST", c.EndpointURL.String(), body)
	if err != nil {
		log.Errorf("failed to create a new http post request, error: %s", err.Error())
	}

	req.Header.Add(ContentTypeHeaderKey, c.ContentType)
	req.Header.Add(UserAgentHeaderKey, UserAgentHeaderValue)

	for _, headerObj := range c.HeaderList {
		req.Header.Add(headerObj.Key, headerObj.Value)
	}
	resp, err := client.Do(req)
	if err != nil {
		log.Errorf("failed to do the post http request, error: %s", err.Error())
		return err
	}
	defer resp.Body.Close()

	switch resp.StatusCode {
	case http.StatusOK, http.StatusCreated, http.StatusAccepted, http.StatusNoContent: //200, 201, 202, 204
		log.Infof("post successfully with response code: %d", resp.StatusCode)
		return nil
	default:
		msg, _ := io.ReadAll(resp.Body)
		log.Errorf("unexpected response: %d, report data: %s", resp.StatusCode, msg)
		return errors.New(resp.Status)
	}
}

// BasicAuth adds an HTTP Basic Authentication compliant header to the Client.
func (c *Client) BasicAuth(username, password string) {
	// Check out RFC7617 for the specifics on this code.
	// https://datatracker.ietf.org/doc/html/rfc7617
	userPass := username + ":" + password
	b64UserPass := base64.StdEncoding.EncodeToString([]byte(userPass))
	c.AddHeader(AuthorizationHeaderKey, "Basic "+b64UserPass)
}

// AddHeader adds an HTTP Header to the Client.
func (c *Client) AddHeader(key, value string) {
	c.HeaderList = append(c.HeaderList, Header{Key: key, Value: value})
}
