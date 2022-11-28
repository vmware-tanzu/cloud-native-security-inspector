// Copyright 2022 VMware, Inc.
// SPDX-License-Identifier: Apache-2.0
package redis

import (
	"context"
	"fmt"

	"github.com/gomodule/redigo/redis"
	"github.com/pkg/errors"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/pkg/data"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/pkg/data/core"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/pkg/data/types"
)

// Client for handing data in cache.
type Client struct {
	RedisPool *redis.Pool
	// Time for the item living in the cache.
	LivingTime int64
}

// Read implements cache.Client.
func (c *Client) Read(ctx context.Context, id core.ArtifactID, options ...data.ReadOption) ([]types.Store, error) {
	// Init options.
	rOpts := &data.ReadOptions{}
	for _, opt := range options {
		opt(rOpts)
	}

	if len(rOpts.Metas) == 0 {
		// No info to process.
		return nil, errors.New("no metadata specified for retrieving cache data")
	}

	conn := c.RedisPool.Get()
	defer conn.Close()

	stores := make([]types.Store, 0)
	for _, meta := range rOpts.Metas {
		js, err := redis.String(conn.Do("GET", key(id, meta)))
		if err != nil {
			return nil, errors.Wrap(err, "get cache data")
		}

		// Parse JSON data.
		store, err := types.GetStore(meta)
		if err != nil {
			return nil, errors.Wrap(err, "get store")
		}

		// Fill in data.
		store.FromJSON(js)
		// Any error occurred during reading cache of specified data type, it should treat as a whole cache failure.
		// Because we can try to retrieve date from the provider again.
		if err := store.Validate(); err != nil {
			return nil, errors.Wrap(err, "parse data from JSON")
		}

		stores = append(stores, store)
	}

	return stores, nil
}

// Write implements cache.Client.
func (c *Client) Write(ctx context.Context, id core.ArtifactID, data []types.Store) error {
	if len(data) == 0 {
		// Do nothing
		return nil
	}

	conn := c.RedisPool.Get()
	defer conn.Close()

	// Start a transaction to write as whole action.
	if err := conn.Send("MULTI"); err != nil {
		return errors.Wrap(err, "start redis transaction")
	}
	// Append sub commands.
	for _, d := range data {
		args := redis.Args{}.
			Add(key(id, d.Metadata())).
			Add(d.ToJSON()).
			Add("EX").
			Add(c.LivingTime)

		if err := conn.Send("SET", args...); err != nil {
			return errors.Wrap(err, "write cache data")
		}
	}
	// Commit transaction.
	if _, err := conn.Do("EXEC"); err != nil {
		return errors.Wrap(err, "commit redis transaction")
	}

	return nil
}

func key(id core.ArtifactID, meta core.Metadata) string {
	return fmt.Sprintf("%s:%s", meta.String(), id.String())
}
