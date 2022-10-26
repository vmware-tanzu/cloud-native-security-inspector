module github.com/vmware-tanzu/cloud-native-security-inspector

go 1.16

require (
	github.com/elastic/go-elasticsearch/v8 v8.4.0
	github.com/go-logr/logr v0.4.0
	github.com/go-openapi/errors v0.20.1
	github.com/go-openapi/runtime v0.21.0
	github.com/go-openapi/strfmt v0.21.0
	github.com/go-openapi/swag v0.19.15
	github.com/go-openapi/validate v0.20.3
	github.com/goharbor/go-client v0.25.0
	github.com/goharbor/harbor/src v0.0.0-20211025104526-d4affc2eba6d
	github.com/gomodule/redigo v2.0.0+incompatible
	github.com/pkg/errors v0.9.1
	github.com/stretchr/testify v1.7.0
	k8s.io/api v0.22.2
	k8s.io/apimachinery v0.22.2
	k8s.io/apiserver v0.22.2
	k8s.io/client-go v0.22.2
	sigs.k8s.io/controller-runtime v0.10.2
)
