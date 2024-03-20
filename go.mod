module github.com/vmware-tanzu/cloud-native-security-inspector

go 1.20

require github.com/goharbor/harbor/src v0.0.0-20231031103200-f75a2f9407cb

require (
	github.com/aquasecurity/trivy v0.40.0
	github.com/go-co-op/gocron v1.28.0
	github.com/imroc/req/v3 v3.35.0
)

require github.com/spdx/tools-golang v0.5.0 // indirect

require (
	github.com/FZambia/sentinel v1.1.1
	github.com/aquasecurity/harbor-scanner-trivy v0.30.11
	github.com/aquasecurity/kube-bench v0.6.12
	github.com/caarlos0/env/v6 v6.10.1
	github.com/docker/docker v24.0.9+incompatible
	github.com/docker/go-connections v0.4.0
	github.com/fsnotify/fsnotify v1.6.0
	github.com/gin-gonic/gin v1.9.1
	github.com/go-openapi/errors v0.20.3
	github.com/go-openapi/runtime v0.25.0
	github.com/go-openapi/strfmt v0.21.7
	github.com/go-openapi/swag v0.22.3
	github.com/go-openapi/validate v0.22.1
	github.com/goark/go-cvss v1.6.6
	github.com/gocraft/work v0.5.1
	github.com/goharbor/go-client v0.26.2
	github.com/gomodule/redigo v2.0.0+incompatible
	github.com/gorilla/mux v1.8.0
	github.com/onsi/ginkgo v1.16.5
	github.com/onsi/gomega v1.27.6
	github.com/opencontainers/go-digest v1.0.0
	github.com/pkg/errors v0.9.1
	github.com/prometheus/client_golang v1.14.0
	github.com/sirupsen/logrus v1.9.3
	github.com/spf13/viper v1.15.0
	github.com/stretchr/testify v1.8.4
	github.com/testcontainers/testcontainers-go v0.17.0
	go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp v0.45.0 // indirect
	golang.org/x/net v0.17.0
	golang.org/x/oauth2 v0.10.0
	golang.org/x/xerrors v0.0.0-20220907171357-04be3eba64a2
	k8s.io/api v0.26.3
	k8s.io/apimachinery v0.26.3
	k8s.io/apiserver v0.26.2
	k8s.io/client-go v0.26.3
	k8s.io/utils v0.0.0-20230220204549-a5ecb0141aa5
	sigs.k8s.io/controller-runtime v0.14.6
	sigs.k8s.io/e2e-framework v0.2.0
)

require (
	github.com/Azure/go-ansiterm v0.0.0-20210617225240-d185dfc1b5a1 // indirect
	github.com/Microsoft/go-winio v0.6.1 // indirect
	github.com/Microsoft/hcsshim v0.11.4 // indirect
	github.com/aquasecurity/trivy-db v0.0.0-20230411140759-3c2ee2168575 // indirect
	github.com/asaskevich/govalidator v0.0.0-20230301143203-a9d515a09cc2 // indirect
	github.com/aws/aws-sdk-go-v2 v1.17.7 // indirect
	github.com/aws/aws-sdk-go-v2/service/securityhub v1.23.5 // indirect
	github.com/aws/smithy-go v1.13.5 // indirect
	github.com/beego/beego/v2 v2.0.6 // indirect
	github.com/beorn7/perks v1.0.1 // indirect
	github.com/bytedance/sonic v1.9.1 // indirect
	github.com/cenkalti/backoff/v4 v4.2.1 // indirect
	github.com/cespare/xxhash/v2 v2.2.0 // indirect
	github.com/chenzhuoyu/base64x v0.0.0-20221115062448-fe3a3abad311 // indirect
	github.com/containerd/containerd v1.7.11 // indirect
	github.com/containerd/log v0.1.0 // indirect
	github.com/davecgh/go-spew v1.1.1 // indirect
	github.com/docker/distribution v2.8.2+incompatible // indirect
	github.com/docker/go-units v0.5.0 // indirect
	github.com/emicklei/go-restful/v3 v3.10.1 // indirect
	github.com/evanphx/json-patch v5.6.0+incompatible // indirect
	github.com/evanphx/json-patch/v5 v5.6.0 // indirect
	github.com/felixge/httpsnoop v1.0.3 // indirect
	github.com/gabriel-vasile/mimetype v1.4.2 // indirect
	github.com/gin-contrib/sse v0.1.0 // indirect
	github.com/go-logr/logr v1.2.4 // indirect
	github.com/go-logr/stdr v1.2.2 // indirect
	github.com/go-logr/zapr v1.2.3 // indirect
	github.com/go-openapi/analysis v0.21.4 // indirect
	github.com/go-openapi/jsonpointer v0.19.5 // indirect
	github.com/go-openapi/jsonreference v0.20.0 // indirect
	github.com/go-openapi/loads v0.21.2 // indirect
	github.com/go-openapi/spec v0.20.8 // indirect
	github.com/go-playground/locales v0.14.1 // indirect
	github.com/go-playground/universal-translator v0.18.1 // indirect
	github.com/go-playground/validator/v10 v10.14.0 // indirect
	github.com/go-task/slim-sprig v0.0.0-20230315185526-52ccab3ef572 // indirect
	github.com/goark/errs v1.1.0 // indirect
	github.com/goccy/go-json v0.10.2 // indirect
	github.com/gogo/protobuf v1.3.2 // indirect
	github.com/golang/glog v1.1.0 // indirect
	github.com/golang/groupcache v0.0.0-20210331224755-41bb18bfe9da // indirect
	github.com/golang/mock v1.6.0 // indirect
	github.com/golang/protobuf v1.5.3 // indirect
	github.com/google/gnostic v0.5.7-v3refs // indirect
	github.com/google/go-cmp v0.5.9 // indirect
	github.com/google/go-containerregistry v0.14.0 // indirect
	github.com/google/gofuzz v1.2.0 // indirect
	github.com/google/pprof v0.0.0-20230426061923-93006964c1fc // indirect
	github.com/google/uuid v1.3.0 // indirect
	github.com/grpc-ecosystem/grpc-gateway/v2 v2.16.0 // indirect
	github.com/hashicorp/errwrap v1.1.0 // indirect
	github.com/hashicorp/go-multierror v1.1.1 // indirect
	github.com/hashicorp/golang-lru v0.5.4 // indirect
	github.com/hashicorp/hcl v1.0.0 // indirect
	github.com/imdario/mergo v0.3.13 // indirect
	github.com/jackc/chunkreader/v2 v2.0.1 // indirect
	github.com/jackc/pgconn v1.14.0 // indirect
	github.com/jackc/pgio v1.0.0 // indirect
	github.com/jackc/pgpassfile v1.0.0 // indirect
	github.com/jackc/pgproto3/v2 v2.3.2 // indirect
	github.com/jackc/pgservicefile v0.0.0-20221227161230-091c0ba34f0a // indirect
	github.com/josharian/intern v1.0.0 // indirect
	github.com/json-iterator/go v1.1.12 // indirect
	github.com/klauspost/compress v1.16.0 // indirect
	github.com/klauspost/cpuid/v2 v2.2.4 // indirect
	github.com/leodido/go-urn v1.2.4 // indirect
	github.com/magiconair/properties v1.8.7 // indirect
	github.com/mailru/easyjson v0.7.7 // indirect
	github.com/mattn/go-isatty v0.0.19 // indirect
	github.com/matttproud/golang_protobuf_extensions v1.0.4 // indirect
	github.com/mitchellh/mapstructure v1.5.0 // indirect
	github.com/moby/patternmatcher v0.5.0 // indirect
	github.com/moby/spdystream v0.2.0 // indirect
	github.com/moby/sys/sequential v0.5.0 // indirect
	github.com/moby/term v0.0.0-20221205130635-1aeaba878587 // indirect
	github.com/modern-go/concurrent v0.0.0-20180306012644-bacd9c7ef1dd // indirect
	github.com/modern-go/reflect2 v1.0.2 // indirect
	github.com/morikuni/aec v1.0.0 // indirect
	github.com/munnerz/goautoneg v0.0.0-20191010083416-a7dc8b61c822 // indirect
	github.com/nxadm/tail v1.4.8 // indirect
	github.com/oklog/ulid v1.3.1 // indirect
	github.com/onsi/ginkgo/v2 v2.9.5 // indirect
	github.com/opencontainers/image-spec v1.1.0-rc2.0.20221020182949-4df8887994e8 // indirect
	github.com/opencontainers/runc v1.1.12 // indirect
	github.com/opentracing/opentracing-go v1.2.0 // indirect
	github.com/pelletier/go-toml/v2 v2.0.8 // indirect
	github.com/pmezard/go-difflib v1.0.0 // indirect
	github.com/prometheus/client_model v0.3.0 // indirect
	github.com/prometheus/common v0.39.0 // indirect
	github.com/prometheus/procfs v0.8.0 // indirect
	github.com/quic-go/qpack v0.4.0 // indirect
	github.com/quic-go/qtls-go1-20 v0.3.1 // indirect
	github.com/quic-go/quic-go v0.37.7 // indirect
	github.com/robfig/cron v1.2.0 // indirect
	github.com/robfig/cron/v3 v3.0.1 // indirect
	github.com/samber/lo v1.37.0 // indirect
	github.com/shiena/ansicolor v0.0.0-20200904210342-c7312218db18 // indirect
	github.com/spf13/afero v1.9.3 // indirect
	github.com/spf13/cast v1.5.0 // indirect
	github.com/spf13/jwalterweatherman v1.1.0 // indirect
	github.com/spf13/pflag v1.0.5 // indirect
	github.com/stretchr/objx v0.5.0 // indirect
	github.com/subosito/gotenv v1.4.2 // indirect
	github.com/twitchyliquid64/golang-asm v0.15.1 // indirect
	github.com/ugorji/go/codec v1.2.11 // indirect
	github.com/vladimirvivien/gexe v0.2.0 // indirect
	go.mongodb.org/mongo-driver v1.11.3 // indirect
	go.opentelemetry.io/otel v1.19.0 // indirect
	go.opentelemetry.io/otel/exporters/jaeger v1.0.0 // indirect
	go.opentelemetry.io/otel/exporters/otlp/otlptrace v1.19.0 // indirect
	go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp v1.19.0 // indirect
	go.opentelemetry.io/otel/metric v1.19.0 // indirect
	go.opentelemetry.io/otel/sdk v1.19.0 // indirect
	go.opentelemetry.io/otel/trace v1.19.0 // indirect
	go.opentelemetry.io/proto/otlp v1.0.0 // indirect
	go.uber.org/atomic v1.10.0 // indirect
	go.uber.org/multierr v1.9.0 // indirect
	go.uber.org/zap v1.24.0 // indirect
	golang.org/x/arch v0.3.0 // indirect
	golang.org/x/crypto v0.17.0 // indirect
	golang.org/x/exp v0.0.0-20230425010034-47ecfdc1ba53 // indirect
	golang.org/x/mod v0.11.0 // indirect
	golang.org/x/sys v0.15.0 // indirect
	golang.org/x/term v0.15.0 // indirect
	golang.org/x/text v0.14.0 // indirect
	golang.org/x/time v0.3.0 // indirect
	golang.org/x/tools v0.10.0 // indirect
	gomodules.xyz/jsonpatch/v2 v2.2.0 // indirect
	google.golang.org/appengine v1.6.7 // indirect
	google.golang.org/genproto/googleapis/api v0.0.0-20230711160842-782d3b101e98 // indirect
	google.golang.org/genproto/googleapis/rpc v0.0.0-20230711160842-782d3b101e98 // indirect
	google.golang.org/grpc v1.58.3 // indirect
	google.golang.org/protobuf v1.31.0 // indirect
	gopkg.in/inf.v0 v0.9.1 // indirect
	gopkg.in/ini.v1 v1.67.0 // indirect
	gopkg.in/tomb.v1 v1.0.0-20141024135613-dd632973f1e7 // indirect
	gopkg.in/yaml.v2 v2.4.0 // indirect
	gopkg.in/yaml.v3 v3.0.1 // indirect
	k8s.io/apiextensions-apiserver v0.26.1 // indirect
	k8s.io/component-base v0.26.3 // indirect
	k8s.io/klog/v2 v2.90.1 // indirect
	k8s.io/kube-openapi v0.0.0-20221012153701-172d655c2280 // indirect
	sigs.k8s.io/json v0.0.0-20220713155537-f223a00ba0e2 // indirect
	sigs.k8s.io/structured-merge-diff/v4 v4.2.3 // indirect
	sigs.k8s.io/yaml v1.3.0 // indirect
)

replace github.com/spdx/tools-golang => github.com/spdx/tools-golang v0.3.0
