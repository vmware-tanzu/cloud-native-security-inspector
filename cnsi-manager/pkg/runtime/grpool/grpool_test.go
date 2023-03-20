// Copyright 2022 VMware, Inc.
// SPDX-License-Identifier: Apache-2.0
package grpool

import (
	"context"
	"fmt"
	"testing"

	"github.com/stretchr/testify/suite"
)

// GrpoolTestSuite is a test suite to test grpool.
type GrpoolTestSuite struct {
	suite.Suite
}

// TestGrpool is entry of the GrpoolTestSuite.
func TestGrpool(t *testing.T) {
	suite.Run(t, &GrpoolTestSuite{})
}

// TestRun tests run process of the pool.
func (suite *GrpoolTestSuite) TestRun() {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	pool := WithContext(ctx).
		MaxWorkers(2).
		MaxQueueSize(2).
		Start()
	defer pool.Close()

	jobFactory := func(serial int) Job {
		return func(ctx context.Context) <-chan error {
			resChan := make(chan error, 1)

			fmt.Printf("jobFactory.job[%d]\n", serial)
			resChan <- nil

			return resChan
		}
	}

	pool.Plan(10)
	for i := 0; i < 10; i++ {
		pool.Queue(jobFactory(i))
	}

	err := pool.Wait()
	suite.NoError(err, "no error after pool waiting")
	fmt.Println("after pool.wait1")

	failJobFactory := func(serial int) Job {
		return func(ctx context.Context) <-chan error {
			resChan := make(chan error, 1)

			fmt.Printf("failJobFactory.job[%d]\n", serial)
			if serial%5 == 0 {
				resChan <- fmt.Errorf("job error: %d", serial)
				return resChan
			}

			resChan <- nil
			return resChan
		}
	}

	pool.Plan(6)
	for i := 0; i < 6; i++ {
		pool.Queue(failJobFactory(i))
	}

	err = pool.Wait()
	suite.Errorf(err, "error after pool waiting")
}
