// Copyright 2022 VMware, Inc.
// SPDX-License-Identifier: Apache-2.0
package grpool

import (
	"context"
	"fmt"
	"log"
	"sync"

	"github.com/pkg/errors"

	"github.com/go-logr/logr"
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

// pool is an implementation of Pool.
type pool struct {
	workers   chan struct{}
	workerNum uint32
	queue     chan Job
	ctx       context.Context
	stopChan  chan struct{}
	lastErr   error
	wg        *sync.WaitGroup
	logger    logr.Logger
	errLock   *sync.Mutex
}

// WithContext inits the worker pool with context.
func WithContext(ctx context.Context) *pool {
	return &pool{
		ctx:      ctx,
		stopChan: make(chan struct{}),
		wg:       &sync.WaitGroup{},
		errLock:  &sync.Mutex{},
	}
}

// MaxWorkers sets the max number of concurrent workers.
func (p *pool) MaxWorkers(workers uint32) *pool {
	p.workerNum = workers
	p.workers = make(chan struct{}, workers)
	return p
}

// MaxQueueSize set the job queue size.
// If the job queue is full, then the related job queuing calls will be blocked.
func (p *pool) MaxQueueSize(size uint32) *pool {
	p.queue = make(chan Job, size)
	return p
}

// WithLogger sets logger for the pool.
// If no logger is set, no logs will be output_datasource.
func (p *pool) WithLogger(logger logr.Logger) *pool {
	if logger != (logr.Logger{}) {
		p.logger = logger.WithName("grpool")
	}

	return p
}

func (p *pool) Start() Pool {
	// If workers are not inited, then init workers with default setting.
	if p.workers == nil {
		p.workers = make(chan struct{}, defaultWorkers)
	}

	// If job queue is not created, then create it with default setting.
	if p.queue == nil {
		p.queue = make(chan Job, defaultQueueSize)
	}

	p.log("Error collector is started", nil)

	// Start the job processing flow.
	go func() {
		defer func() {
			close(p.workers)
			close(p.queue)

			p.stopChan <- struct{}{}

			p.log("Job processor exits", nil)
		}()

		// For notifying job runner that pool is stopped.
		sigChan := make(chan struct{})

		for {
			select {
			// Processing jobs.
			case job := <-p.queue:
				// Find a worker first.
				// If all the workers are busy, process workflow will be blocked here.
				p.workers <- struct{}{}
				p.log("worker occupied", nil, "available workers", p.availableWorkers())

				// Run job now.
				go func() {
					defer func() {
						// Decrease 1 from the plan size.
						p.wg.Done()
						// Return the worker.
						<-p.workers
						p.log("worker released", nil, "available workers", p.availableWorkers())
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

	p.log("Job processor is started", nil)
	return p
}

// Plan the job size.
func (p *pool) Plan(jobSize int) error {
	if jobSize <= 0 {
		return errors.New("job size should be greater than 0")
	}

	p.wg.Add(jobSize)
	return nil
}

func (p *pool) handleLastError(err error) {
	if err == nil {
		return
	}

	p.errLock.Lock()
	defer p.errLock.Unlock()

	// Record error.
	p.log("Error", err)
	if p.lastErr == nil {
		p.lastErr = err
	} else {
		p.lastErr = fmt.Errorf("%s:%w", p.lastErr.Error(), err)
	}
}

func (p *pool) availableWorkers() uint32 {
	return p.workerNum - (uint32)(len(p.workers))
}

func (p *pool) log(message string, err error, keysAndValues ...interface{}) {
	if p.logger != (logr.Logger{}) {
		if err != nil {
			p.logger.Error(err, message, keysAndValues...)
			return
		}

		p.logger.Info(message, keysAndValues...)
		return
	}

	// Use default logger.
	if err != nil {
		log.Printf("%s:%s\n", message, err)
	} else {
		log.Println(message)
	}
}

// Close implements Pool.
func (p *pool) Close() {
	p.stopChan <- struct{}{}
	// Wait for ack as queue is closed.
	<-p.queue
}

// Queue implements Pool.
func (p *pool) Queue(job Job) {
	if job != nil {
		p.queue <- job
	}
}

// Wait implements Pool.
func (p *pool) Wait() error {
	p.wg.Wait()
	return p.lastErr
}
