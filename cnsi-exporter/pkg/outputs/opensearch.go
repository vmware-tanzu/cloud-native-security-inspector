package outputs

import (
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/lib/log"
)

// OpenSearchPost posts event to OpenSearch
func (c *Client) OpenSearchPost(payloadStr string) {
	if c.Config.OpenSearch.Username != "" && c.Config.OpenSearch.Password != "" {
		c.BasicAuth(c.Config.OpenSearch.Username, c.Config.OpenSearch.Password)
	}
	err := c.Post(payloadStr)
	if err != nil {
		if len(payloadStr) > 128 {
			payloadStr = payloadStr[:128]
		}
		log.Errorf("failed to post to opensearch, payload: %s, %v", payloadStr, err)
		return
	}
}
