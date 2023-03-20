// Copyright 2022 VMware, Inc.
// SPDX-License-Identifier: Apache-2.0
package cache

import (
	"time"

	"github.com/gomodule/redigo/redis"
	"github.com/pkg/errors"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/api/v1alpha1"
	myredis "github.com/vmware-tanzu/cloud-native-security-inspector/src/pkg/data/cache/redis"
)

const (
	// DialConnectionTimeout defines timeout for connecting to redis server.
	DialConnectionTimeout = 5 * time.Second
	// DialReadTimeout defines timeout for reading command.
	DialReadTimeout = 5 * time.Second
	// DialWriteTimeout defines timeout for writing command.
	DialWriteTimeout = 5 * time.Second
)

const (
	// ClientKindRedis represents redis cache kind.
	ClientKindRedis = "Redis"
)

// Redis client.
var _ Client = &myredis.Client{}

// GetClient is a cache client factory method.
// Init cache client based on the config provided.
func GetClient(config *v1alpha1.Cache) (Client, error) {
	switch config.Kind {
	case ClientKindRedis:
		return NewRedisClient(config), nil
	}

	return nil, errors.Errorf("no cache client implemented for kind: %s", config.Kind)
}

// NewRedisClient news a Redis cache client based on the provided configurations.
func NewRedisClient(c *v1alpha1.Cache) Client {
	dialOpts := []redis.DialOption{
		redis.DialConnectTimeout(DialConnectionTimeout),
		redis.DialReadTimeout(DialReadTimeout),
		redis.DialWriteTimeout(DialWriteTimeout),
	}

	if c.Settings.SkipTLSVerify != nil {
		dialOpts = append(dialOpts, redis.DialTLSSkipVerify(*c.Settings.SkipTLSVerify))
	}

	if c.Database != nil {
		dialOpts = append(dialOpts, redis.DialDatabase(*c.Database))
	}

	// if c.Credential != nil && len(c.Credential.AccessSecret) > 0 {
	// 	dialOpts = append(dialOpts, redis.DialPassword(c.Credential.AccessSecret))
	// }

	return &myredis.Client{
		LivingTime: c.Settings.LivingTime,
		RedisPool: &redis.Pool{
			Dial: func() (redis.Conn, error) {
				return redis.DialURL(c.Address, dialOpts...)
			},
			TestOnBorrow: func(c redis.Conn, t time.Time) error {
				if time.Since(t) < time.Minute {
					return nil
				}
				_, err := c.Do("ping")
				return err
			},
			MaxIdle:     3,
			MaxActive:   5,
			IdleTimeout: time.Minute,
		},
	}
}
