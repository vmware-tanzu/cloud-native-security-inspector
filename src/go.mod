module github.com/vmware-tanzu/cloud-native-security-inspector

go 1.16

require (
	github.com/go-logr/logr v1.2.3
	github.com/go-openapi/errors v0.20.3
	github.com/go-openapi/runtime v0.24.2
	github.com/go-openapi/strfmt v0.21.3
	github.com/go-openapi/swag v0.22.3
	github.com/go-openapi/validate v0.22.0
	github.com/goharbor/go-client v0.25.0
	github.com/goharbor/harbor/src v0.0.0-20221018123215-65a8649d4916
	github.com/gomodule/redigo v2.0.0+incompatible
	github.com/onsi/ginkgo v1.16.5
	github.com/onsi/gomega v1.22.1
	github.com/pkg/errors v0.9.1
	github.com/stretchr/testify v1.8.0
	k8s.io/api v0.25.3
	k8s.io/apimachinery v0.25.3
	k8s.io/apiserver v0.25.3
	k8s.io/client-go v0.25.3
	sigs.k8s.io/controller-runtime v0.13.0
)
