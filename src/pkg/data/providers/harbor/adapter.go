// Copyright 2022 VMware, Inc.
// SPDX-License-Identifier: Apache-2.0
package harbor

import (
	"bytes"
	"context"
	"crypto/tls"
	"encoding/json"
	"fmt"
	harborclient "github.com/goharbor/go-client/pkg/harbor"
	"github.com/goharbor/harbor/src/pkg/scan/vuln"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/lib/log"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/goharbor/go-client/pkg/harbor"
	"github.com/goharbor/go-client/pkg/sdk/v2.0/client/artifact"
	"github.com/goharbor/go-client/pkg/sdk/v2.0/client/ping"
	"github.com/goharbor/go-client/pkg/sdk/v2.0/client/project"
	"github.com/goharbor/go-client/pkg/sdk/v2.0/client/registry"
	"github.com/goharbor/go-client/pkg/sdk/v2.0/client/replication"
	"github.com/goharbor/go-client/pkg/sdk/v2.0/client/scan_all"
	"github.com/goharbor/go-client/pkg/sdk/v2.0/models"
	"github.com/pkg/errors"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/api/v1alpha1"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/pkg/data"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/pkg/data/cache"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/pkg/data/core"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/pkg/data/types"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/pkg/errs"
	v1 "k8s.io/api/core/v1"
	k8client "sigs.k8s.io/controller-runtime/pkg/client"
)

// Adapter for handling data from Harbor.
type Adapter struct {
	// client of Harbor.
	cli *harbor.ClientSet
	// k8sClient of cluster.
	k8sClient k8client.Client
	// cache client for reading caching data.
	cache cache.Client
	// clientConfig the client's info of the harbor instance
	clientConfig harborclient.ClientSetConfig
}

// WithClient sets Harbor client.
func (a *Adapter) WithClient(cli *harbor.ClientSet) *Adapter {
	a.cli = cli
	return a
}

func (a *Adapter) WithK8sClient(client k8client.Client) *Adapter {
	a.k8sClient = client
	return a
}

// WithCache sets cache client.
func (a *Adapter) WithCache(cache cache.Client) *Adapter {
	a.cache = cache
	return a
}

// WithClientConfig sets the client config of this harbor instance
func (a *Adapter) WithClientConfig(clientConfig harborclient.ClientSetConfig) *Adapter {
	a.clientConfig = clientConfig
	return a
}

// Read implements data.Provider.
func (a *Adapter) Read(ctx context.Context, id core.ArtifactID, options ...data.ReadOption) ([]types.Store, error) {
	// First check if cache is inited.
	if a.cache != nil {
		// Read data from cache first.
		stores, err := a.cache.Read(ctx, id, options...)
		if err == nil {
			return stores, nil
		}

		log.Error(err, "read data from cache")
	}

	// Retrieve data from harbor.
	// TODO: handle registry and repository.
	withScan := true
	xAcceptVulnerabilities := core.DataSchemeVulnerability
	getOK, err := a.cli.V2().Artifact.GetArtifact(ctx, &artifact.GetArtifactParams{
		ProjectName:            id.Namespace(),
		RepositoryName:         id.Repository(),
		Reference:              id.Digest(),
		WithScanOverview:       &withScan,
		XAcceptVulnerabilities: &xAcceptVulnerabilities,
	})

	if err != nil {
		// when artifact not found
		if errNotFound, ok := err.(*artifact.GetArtifactNotFound); ok {
			return nil, fmt.Errorf("%w: %v", core.ErrorArtifactNotFound, errNotFound)
		}
		// when harbor project not exist, will return 403, also think artifact
		// not found
		if errForbid, ok := err.(*artifact.GetArtifactForbidden); ok {
			return nil, fmt.Errorf("%w: %v", core.ErrorArtifactNotFound, errForbid)
		}

		return nil, errors.Wrap(err, "get harbor artifact")
	}

	// Check read options.
	opts := &data.ReadOptions{}
	for _, opt := range options {
		opt(opts)
	}

	// If no data metadata specified, means all data are required.
	if len(opts.Metas) == 0 {
		// Add metadata of all supported data types.
		opts.Metas = append(opts.Metas, types.VulStoreMeta)
	}

	stores := make([]types.Store, 0)
	for _, meta := range opts.Metas {
		vs, err := types.GetStore(meta)
		if err != nil {
			// No need to proceed here.
			return nil, errors.Wrap(err, "get store from meta")
		}

		// Extract data based on data type.
		switch meta.String() {
		case types.VulStoreMeta.String():
			// Extract data
			ov := getOK.GetPayload().ScanOverview
			nv, ok := ov[core.DataSchemeVulnerability]
			if !ok {
				vs.SetError(errs.NoDataError)
			} else {
				// Fill in data.
				vs.FillIn(id, nv)
			}
		}

		stores = append(stores, vs)
	}

	// write cache if needed
	if a.cache != nil {
		err = a.cache.Write(ctx, id, stores)
		if err != nil {
			// just need to log error
			log.Error(err, "write data to cache")
		}
	}

	return stores, nil
}

// Ping implements data.HealthChecker.
func (a *Adapter) Ping(ctx context.Context) error {
	params := ping.NewGetPingParams()
	_, err := a.cli.V2().Ping.GetPing(ctx, params)
	return err
}

// Request implements data.Provider.
func (a *Adapter) Request(ctx context.Context, id core.ArtifactID) error {
	// skip request for no tag artifact
	if id.Tag() == "" {
		return nil
	}
	// ensure project
	err := a.ensureProject(ctx, id.Namespace())
	if err != nil {
		return errors.Wrap(err, "ensure project")
	}
	// ensure replication policy
	pid, err := a.ensureReplicationPolicy(ctx, id)
	if err != nil {
		return errors.Wrap(err, "ensure replication policy")
	}
	// start replicate
	err = a.triggerReplication(ctx, pid)
	if err != nil {
		return errors.Wrap(err, "trigger replication")
	}

	return nil
}

// ensureProject ensures two things.
// 1. project exist in harbor, create project if not exist
// 2. open the scan on push for this project
func (a *Adapter) ensureProject(ctx context.Context, name string) error {
	var pro *models.Project
	var found bool

	res, err := a.cli.V2().Project.GetProject(ctx, &project.GetProjectParams{
		ProjectNameOrID: name,
	})
	if err == nil {
		pro = res.Payload
		found = true
	}

	autoScan := "true"
	req := &models.ProjectReq{
		ProjectName: name,
		Metadata: &models.ProjectMetadata{
			AutoScan: &autoScan,
		},
	}
	// create project if not found
	if !found {
		_, err = a.cli.V2().Project.CreateProject(ctx, &project.CreateProjectParams{
			Project: req,
		})
		if err != nil {
			return errors.Wrapf(err, "create project '%s'", name)
		}
	} else {
		// update project if not open scan on push
		if pro.Metadata == nil || pro.Metadata.AutoScan == nil || *pro.Metadata.AutoScan != autoScan {
			_, err = a.cli.V2().Project.UpdateProject(ctx, &project.UpdateProjectParams{
				Project: req,
			})
			if err != nil {
				return errors.Wrapf(err, "update project '%s'", name)
			}
		}
	}

	return nil
}

// artifactIDToPolicyName converts artifactID to policy name, should replace invalid char.
// eg.
// k8s.gcr.io/kube-controller-manager@sha256:2b0d1414865856cf0e35682c350808192a9a97cf408816cd97fdcbeedf870b4a
// ===>
// k8s.gcr.io-kube-controller-manager-sha256-2b0d1414865856cf0e35682c350808192a9a97cf408816cd97fdcbeedf870b4a
func artifactIDToPolicyName(id core.ArtifactID) string {
	s := id.String()
	replace := "-"
	symbols := []string{"/", ":", "@"}

	for _, sym := range symbols {
		s = strings.ReplaceAll(s, sym, replace)
	}

	return s
}

// ensureReplicationPolicy ensures the replication policy has been setup.
func (a *Adapter) ensureReplicationPolicy(ctx context.Context, id core.ArtifactID) (int64, error) {
	var policyID int64 = -1
	// generate policy name by artifactID, replace invalid char
	policyName := artifactIDToPolicyName(id)
	// list replication policies to check whether exist
	q := fmt.Sprintf("name=%s", policyName)

	res, err := a.cli.V2().Replication.ListReplicationPolicies(ctx, &replication.ListReplicationPoliciesParams{
		Q: &q,
	})
	if err != nil {
		return policyID, errors.Wrapf(err, "list replication rule '%s'", policyName)
	}

	if len(res.Payload) == 1 && res.Payload[0].Name == policyName {
		// rule has been setup
		return res.Payload[0].ID, nil
	}

	// list registries
	registries, err := a.listAllRegistries(ctx)
	if err != nil {
		return policyID, errors.Wrap(err, "list all registries")
	}

	var registry *models.Registry
	for _, reg := range registries {
		u, err := url.Parse(reg.URL)
		if err != nil {
			return policyID, errors.Wrapf(err, "parse url %s", reg.URL)
		}

		if u.Host == id.Registry() {
			registry = reg
			break
		}
	}
	// return error if not found
	if registry == nil {
		return policyID, errors.Errorf("failed to find registry with url: %s", id.Registry())
	}
	// create replication rule
	created, err := a.cli.V2().Replication.CreateReplicationPolicy(ctx, &replication.CreateReplicationPolicyParams{
		Policy: generateReplicationPolicy(registry, policyName, id),
	})
	if err != nil {
		return policyID, errors.Wrap(err, "create replication policy")
	}

	return parsePolicyID(created.Location)
}

func generateReplicationPolicy(src *models.Registry, policyName string, id core.ArtifactID) *models.ReplicationPolicy {
	var (
		// default value same with create by UI
		replaceCount int8  = 1
		speed        int32 = -1
		override           = true
		// trigger by manual
		triggerType = "manual"
	)

	policy := &models.ReplicationPolicy{
		SrcRegistry:               src,
		DestNamespaceReplaceCount: &replaceCount,
		Enabled:                   true,
		Filters: []*models.ReplicationFilter{
			{
				Type:  "name",
				Value: fmt.Sprintf("%s/%s", id.Namespace(), id.Repository()),
			},
			{
				Type:       "tag",
				Decoration: "matches",
				Value:      id.Tag(),
			},
		},
		Name:     policyName,
		Override: override,
		Speed:    &speed,
		Trigger: &models.ReplicationTrigger{
			Type: triggerType,
			TriggerSettings: &models.ReplicationTriggerSettings{
				Cron: "",
			},
		},
	}

	return policy
}

func parsePolicyID(location string) (int64, error) {
	ss := strings.Split(location, "/")
	var id string
	if len(ss) > 0 {
		id = ss[len(ss)-1]
	}

	return strconv.ParseInt(id, 10, 64)
}

// triggerReplication triggers replication.
func (a *Adapter) triggerReplication(ctx context.Context, pid int64) error {
	_, err := a.cli.V2().Replication.StartReplication(ctx, &replication.StartReplicationParams{
		Execution: &models.StartReplicationExecution{
			PolicyID: pid,
		},
	})

	return err
}

// getCredsFromSecret gets credentials from secret.
func (a *Adapter) getCredsFromSecret(ctx context.Context, ref *v1.ObjectReference) (accessKey string, accessSecret string, err error) {
	secret := &v1.Secret{}
	if err = a.k8sClient.Get(ctx, k8client.ObjectKey{Namespace: ref.Namespace, Name: ref.Name}, secret); err != nil {
		return
	}

	accessKey = string(secret.Data[v1alpha1.ProviderAccessKey])
	accessSecret = string(secret.Data[v1alpha1.ProviderAccessSecret])
	return
}

// RegisterKnownRegistries implements data.Register.
func (a *Adapter) RegisterKnownRegistries(ctx context.Context, registries []v1alpha1.KnownRegistry) error {
	// list existed registries
	registeredRegistries := make(map[string]*models.Registry)
	rs, err := a.listAllRegistries(ctx)
	if err != nil {
		return errors.Wrap(err, "list registries")
	}
	for i, r := range rs {
		registeredRegistries[r.Name] = rs[i]
	}
	// split down two collections for create and update
	var createSet, updateSet []*models.Registry
	for _, r := range registries {
		reg := &models.Registry{
			Name: r.Name,
			URL:  r.Endpoint,
			Type: r.Provider.String(),
		}
		// tls verify
		if r.SkipTLSVerify {
			reg.Insecure = true
		} else {
			reg.Insecure = false
		}
		// credential
		if r.CredentialRef != nil {
			ak, as, err := a.getCredsFromSecret(ctx, r.CredentialRef)
			if err != nil {
				return err
			}

			reg.Credential = &models.RegistryCredential{
				AccessKey:    ak,
				AccessSecret: as,
				Type:         "basic",
			}
		}
		// check registry whether exist
		if old := registeredRegistries[reg.Name]; old != nil {
			// store id for update
			reg.ID = old.ID
			updateSet = append(updateSet, reg)
		} else {
			// not exist before, put to createSet
			createSet = append(createSet, reg)
		}
	}

	// create registry
	for _, reg := range createSet {
		params := registry.NewCreateRegistryParams().WithRegistry(reg)
		_, err := a.cli.V2().Registry.CreateRegistry(ctx, params)
		if err != nil {
			return errors.Wrapf(err, "failed to create registry: %s", reg.Name)
		}
	}
	// update registry
	for _, reg := range updateSet {
		regUpdate := &models.RegistryUpdate{
			Name:     &reg.Name,
			URL:      &reg.URL,
			Insecure: &reg.Insecure,
		}
		// fill cred
		if reg.Credential != nil {
			regUpdate.AccessKey = &reg.Credential.AccessKey
			regUpdate.AccessSecret = &reg.Credential.AccessSecret
			regUpdate.CredentialType = &reg.Credential.Type
		}
		params := registry.NewUpdateRegistryParams().WithID(reg.ID).WithRegistry(regUpdate)
		_, err := a.cli.V2().Registry.UpdateRegistry(ctx, params)
		if err != nil {
			return errors.Wrapf(err, "failed to update registry: %s", reg.Name)
		}
	}

	return nil
}

func (a *Adapter) listAllRegistries(ctx context.Context) ([]*models.Registry, error) {
	var (
		registries []*models.Registry
		page       int64 = 1
		pageSize   int64 = 100
	)

	for {
		params := registry.NewListRegistriesParams().WithPage(&page).WithPageSize(&pageSize)
		result, err := a.cli.V2().Registry.ListRegistries(ctx, params)
		if err != nil {
			return nil, err
		}

		registries = append(registries, result.Payload...)
		if len(registries) >= int(result.XTotalCount) {
			break
		} else {
			page++
		}
	}

	return registries, nil
}

func (a *Adapter) listAllProjects(ctx context.Context) ([]*models.Project, error) {
	// list all projects
	var (
		projects []*models.Project
		page     int64 = 1
		pageSize int64 = 100
	)

	for {
		params := project.NewListProjectsParams().WithPage(&page).WithPageSize(&pageSize)
		ps, err := a.cli.V2().Project.ListProjects(ctx, params)
		if err != nil {
			return nil, err
		}

		projects = append(projects, ps.Payload...)
		if len(projects) >= int(ps.XTotalCount) {
			break
		} else {
			page++
		}
	}

	return projects, nil
}

// ApplyPolicy implements data.Configurator.
func (a *Adapter) ApplyConfig(ctx context.Context, ds v1alpha1.DataSource) error {
	// create or update scan all schedule
	sched, err := a.cli.V2().ScanAll.GetScanAllSchedule(ctx, scan_all.NewGetScanAllScheduleParams())
	if err != nil {
		return errors.Wrap(err, "failed to get scan all schedule")
	}

	schObj := &models.Schedule{Schedule: &models.ScheduleObj{Type: models.ScheduleObjTypeCustom, Cron: ds.ScanSchedule}}
	if sched.Payload == nil || sched.Payload.Schedule == nil {
		// create schedule
		params := scan_all.NewCreateScanAllScheduleParams().WithSchedule(schObj)
		_, err = a.cli.V2().ScanAll.CreateScanAllSchedule(ctx, params)
		if err != nil {
			return errors.Wrap(err, "failed to create scan all schedule")
		}
	} else {
		// update schedule if different
		if sched.Payload.Schedule.Cron != schObj.Schedule.Cron {
			sched.Payload.Schedule = schObj.Schedule
			params := scan_all.NewUpdateScanAllScheduleParams().WithSchedule(sched.Payload)
			_, err = a.cli.V2().ScanAll.UpdateScanAllSchedule(ctx, params)
			if err != nil {
				return errors.Wrap(err, "failed to update scan all schedule")
			}
		}
	}
	// enable scan on push
	if err = a.scanOnPush(ctx); err != nil {
		return errors.Wrap(err, "failed to enable scan on push")
	}

	return nil
}

// scanOnPush opens scan on push for all projects.
func (a *Adapter) scanOnPush(ctx context.Context) error {
	projects, err := a.listAllProjects(ctx)
	if err != nil {
		return errors.Wrap(err, "failed to list projects")
	}
	// open scan on push for every project
	autoScan := "true"
	for _, p := range projects {
		skip := false
		if p.Metadata != nil && p.Metadata.AutoScan != nil && *p.Metadata.AutoScan == autoScan {
			// this project has opened auto scan, so skip it
			skip = true
		}

		if !skip {
			// update config
			req := &models.ProjectReq{Metadata: &models.ProjectMetadata{AutoScan: &autoScan}}
			params := project.NewUpdateProjectParams().WithProjectNameOrID(p.Name).WithProject(req)
			_, err := a.cli.V2().Project.UpdateProject(ctx, params)
			if err != nil {
				return errors.Wrapf(err, "failed to update project '%s'", p.Name)
			}
		}
	}

	return nil
}

func (a *Adapter) GetVulnerabilitiesList(ctx context.Context, id core.ArtifactID) (*vuln.Report, error) {
	// TODO: When https://github.com/goharbor/harbor/issues/13468 is fixed, this api should use Harbor SDK
	log.Infof("ProjectName: %s \n", id.Namespace())
	log.Infof("RepositoryName: %s \n", id.Repository())
	log.Infof("Reference: %s \n", id.Digest())
	log.Infof("Registry: %s \n", id.Registry())

	xAcceptVulnerabilities := core.DataSchemeVulnerability
	requestURL := fmt.Sprintf("%s/api/v2.0/projects/%s/repositories/%s/artifacts/%s/additions/vulnerabilities",
		a.clientConfig.URL, id.Namespace(), id.Repository(), id.Digest())
	log.Infof("requestURL: %s \n", requestURL)

	request, err := http.NewRequest("GET", requestURL, bytes.NewBuffer(nil))
	if err != nil {
		log.Infof("new request err: %v \n", err)
		return nil, err
	}
	request.Header.Set("X-Accept-Vulnerabilities", xAcceptVulnerabilities)
	request.SetBasicAuth(a.clientConfig.Username, a.clientConfig.Password)
	client := &http.Client{
		Transport: &http.Transport{
			TLSClientConfig: &tls.Config{
				InsecureSkipVerify: a.clientConfig.Insecure,
			},
		},
		Timeout: time.Second * 10,
	}
	res, err := client.Do(request)
	if err != nil {
		log.Errorf("find vulnerabilities err: %v \n", err)
		return nil, err
	}
	var report map[string]*vuln.Report
	err = json.NewDecoder(res.Body).Decode(&report)
	if err != nil {
		body, _ := io.ReadAll(res.Body)
		log.Errorf("vuln report json unmarshal: (%s) \n", string(body[:256]))
		return nil, err
	}
	return report[xAcceptVulnerabilities], nil
}
