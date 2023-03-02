package types

import "github.com/aquasecurity/kube-bench/check"

type CISReport struct {
	check.Controls
	CreateTimestamp string `json:"createTime"`
	NodeName        string `json:"node_name"`
}
