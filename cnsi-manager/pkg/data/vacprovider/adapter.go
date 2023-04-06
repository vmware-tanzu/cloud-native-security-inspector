package vacprovider

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"

	"github.com/vmware-tanzu/cloud-native-security-inspector/cnsi-inspector/pkg/cspauth"
	governor_client "github.com/vmware-tanzu/cloud-native-security-inspector/lib/governor/go-client"
	"github.com/vmware-tanzu/cloud-native-security-inspector/lib/log"
	"k8s.io/client-go/kubernetes"
)

// Adapter for handling data from Harbor.
type Adapter struct {
	// csp Client.
	CspProvider cspauth.Provider
	// Governor Client
	ApiClient *governor_client.APIClient
	// Kubernetes Interface
	KubeInterface kubernetes.Interface
	// csp secret name
	CspSecretName string
	// csp secret namespace
	CspSecretNamespace string
}

func (a *Adapter) getAccessToken(ctx context.Context) (string, error) {
	if a.CspSecretName == "" || a.CspSecretNamespace == "" {
		log.Error("Error while retrieving access token !")
		return "", errors.New("CSP secret name must be set to connect to Governor")
	}
	governorAccessToken, err := a.CspProvider.GetBearerToken(a.KubeInterface, ctx, a.CspSecretNamespace, a.CspSecretName)
	if err != nil {
		log.Error("Error while retrieving access token !")
		return "", err
	}
	return governorAccessToken, nil
}

func (a *Adapter) GetVacProductInfo(imageId string) (*governor_client.Product, error) {
	ctx := context.Background()

	accessToken, err := a.getAccessToken(ctx)
	if err != nil {
		return nil, err
	}

	ctx = context.WithValue(ctx, governor_client.ContextAccessToken, accessToken)

	apiProductRequest := a.ApiClient.ProductsApi.GetProduct(ctx).ImageId(imageId)
	log.Infof("VAC Assessment for image: %+v", imageId)
	// Call api cluster get VAC product info.
	productInfo, response, err := a.ApiClient.ProductsApi.GetProductExecute(apiProductRequest)
	if err != nil {
		if response.StatusCode == http.StatusNotFound {
			var errorJson governor_client.Error
			b, err := io.ReadAll(response.Body)
			if err != nil {
				log.Errorf("Error reading Governor api response body Err: %s, Response Status: %s",
					err, response.Status)
				return nil, errors.New(
					fmt.Sprintf("Error reading Governor api response body Err: %s, Response Status: %s",
						err, response.Status))
			}
			err = json.Unmarshal(b, &errorJson)
			if err != nil {
				log.Errorf("Error Unmarshalling Governor api response body Err: %s, Response Status: %s",
					err, response.Status)
				return nil, errors.New(fmt.Sprintf("Governor api response status: %s", response.Status))
			}

			if *errorJson.Detail == "Product not found" {
				log.Infof("Product Not Found")
				return nil, nil
			}
			return nil, err
		}
	}

	log.Info("successful called governor api")
	log.Info(response)

	if response.StatusCode != http.StatusOK && response.StatusCode != http.StatusNotFound {
		log.Errorf("Governor api response status: %v", response.StatusCode)
		return nil, errors.New(fmt.Sprintf("Governor api response status: %s", response.Status))
	}

	return productInfo, nil
}
