// Copyright 2022 VMware, Inc.
// SPDX-License-Identifier: Apache-2.0
package grpool

import (
	"context"
	"fmt"
	"github.com/pkg/errors"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/lib/log"
	"sync"
)

const (
	defaultQueueSize = 1024
	defaultWorkers   = 102
)

// Job for running in the pool.
type Job func(ctx context.Context) <-chan error

// Pool of running funcs concurrently.
type Pool interface {
	// Close the pool and release resources.
	Close()
	// Plan job size.
	Plan(jobSize int) error
	// Queue job into the pool.
	Queue(job Job)
	// Wait all the jobs completed.
	Wait() error
}

// GrPool is an implementation of Pool.
type GrPool struct {
	workers   chan struct{}
	workerNum uint32
	queue     chan Job
	ctx       context.Context
	stopChan  chan struct{}
	lastErr   error
	wg        *sync.WaitGroup
	errLock   *sync.Mutex
}

// WithContext inits the worker GrPool with context.
func WithContext(ctx context.Context) *GrPool {
	return &GrPool{
		ctx:      ctx,
		stopChan: make(chan struct{}),
		wg:       &sync.WaitGroup{},
		errLock:  &sync.Mutex{},
	}
}

// MaxWorkers sets the max number of concurrent workers.
func (p *GrPool) MaxWorkers(workers uint32) *GrPool {
	p.workerNum = workers
	p.workers = make(chan struct{}, workers)
	return p
}

// MaxQueueSize set the job queue size.
// If the job queue is full, then the related job queuing calls will be blocked.
func (p *GrPool) MaxQueueSize(size uint32) *GrPool {
	p.queue = make(chan Job, size)
	return p
}

func (p *GrPool) Start() Pool {
	// If workers are not inited, then init workers with default setting.
	if p.workers == nil {
		p.workers = make(chan struct{}, defaultWorkers)
	}

	// If job queue is not created, then create it with default setting.
	if p.queue == nil {
		p.queue = make(chan Job, defaultQueueSize)
	}
	log.Info("Error collector is started")

	// Start the job processing flow.
	go func() {
		defer func() {
			close(p.workers)
			close(p.queue)

			p.stopChan <- struct{}{}
			log.Info("Job processor exits", nil)
		}()

		// For notifying job runner that GrPool is stopped.
		sigChan := make(chan struct{})

		for {
			select {
			// Processing jobs.
			case job := <-p.queue:
				// Find a worker first.
				// If all the workers are busy, process workflow will be blocked here.
				p.workers <- struct{}{}
				log.Infof("worker occupied, available workers left: %d", p.availableWorkers())

				// Run job now.
				go func() {
					defer func() {
						// Decrease 1 from the plan size.
						p.wg.Done()
						// Return the worker.
						<-p.workers
						log.Infof("worker released, available workers left: %d", p.availableWorkers())
					}()

					select {
					case e := <-job(p.ctx):
						if e != nil {
							p.handleLastError(e)
						}
						// Pool is stopped.
					case <-sigChan:
						return
						// System exits
					case <-p.ctx.Done():
						return
					}
				}()

			// Pool is closed.
			case <-p.stopChan:
				close(sigChan)
				return
			// System exits.
			case <-p.ctx.Done():
				return
			}
		}
	}()
	log.Info("Job processor is started")
	return p
}

// Plan the job size.
func (p *GrPool) Plan(jobSize int) error {
	if jobSize <= 0 {
		return errors.New("job size should be greater than 0")
	}

	p.wg.Add(jobSize)
	return nil
}

func (p *GrPool) handleLastError(err error) {
	if err == nil {
		return
	}

	p.errLock.Lock()
	defer p.errLock.Unlock()

	if p.lastErr == nil {
		p.lastErr = err
	} else {
		p.lastErr = fmt.Errorf("%s:%w", p.lastErr.Error(), err)
	}
}

func (p *GrPool) availableWorkers() uint32 {
	return p.workerNum - (uint32)(len(p.workers))
}

// Close implements Pool.
func (p *GrPool) Close() {
	p.stopChan <- struct{}{}
	// Wait for ack as queue is closed.
	<-p.queue
}

// Queue implements Pool.
func (p *GrPool) Queue(job Job) {
	if job != nil {
		p.queue <- job
	}
}

// Wait implements Pool.
func (p *GrPool) Wait() error {
	p.wg.Wait()
	return p.lastErr
}
