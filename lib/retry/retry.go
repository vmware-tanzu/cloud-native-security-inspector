package retry

import (
	"context"
	"fmt"
	"log"
	"time"
)

const (
	defaultMaxAttempts = 3
	defaultRetryStep   = 3 * time.Second
)

type delayFunc func(attempt int) time.Duration

type retryConfig struct {
	name        string
	maxAttempts int
	delayFunc   delayFunc
}

type Option func(*retryConfig)

// WithName allows configuring the name of the function in the error message
func WithName(name string) Option {
	return func(o *retryConfig) {
		o.name = name
	}
}

// WithMaxAttempts allows configuring the maximum tries for a given function
func WithMaxAttempts(n int) Option {
	return func(o *retryConfig) {
		o.maxAttempts = n
	}
}

// WithFixedDelay allows configuring a fixed-delay waiting strategy between retries
func WithFixedDelay(delay time.Duration) Option {
	return func(o *retryConfig) {
		o.delayFunc = func(_ int) time.Duration { return delay }
	}
}

// WithIncrementDelay allows configuring a waiting strategy with a custom base delay and increment
func WithIncrementDelay(baseDuration time.Duration, increment time.Duration) Option {
	return func(o *retryConfig) {
		o.delayFunc = func(n int) time.Duration {
			stepIncrement := increment * time.Duration(n)
			return baseDuration + stepIncrement
		}
	}
}

type Retry struct {
	retryConfig
}

func NewRetry(opts ...Option) *Retry {
	var c retryConfig
	for _, o := range append([]Option{
		// Default values
		WithName("retryable function"),
		WithMaxAttempts(defaultMaxAttempts),
		WithFixedDelay(defaultRetryStep),
	}, opts...) {
		o(&c)
	}
	return &Retry{c}
}

func (r *Retry) Run(ctx context.Context, f func() (bool, error)) error {
	timer := time.NewTimer(0)
	defer timer.Stop()
	var attempts int
	for {
		if success, err := f(); err != nil {
			return fmt.Errorf("non retryable error running %q: %w", r.name, err)
		} else if success {
			return nil
		} else {
			log.Printf("running %q failed (%d/%d)\n", r.name, attempts+1, r.maxAttempts)
		}

		delay := r.delayFunc(attempts)
		attempts++
		if attempts == r.maxAttempts {
			return fmt.Errorf("giving up retrying, max attempts %d reached", r.maxAttempts)
		}

		timer.Reset(delay)
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-timer.C:
		}
	}
}

// SetNextRetry allows configuring a custom duration only for the next retry calculated
func (r *Retry) SetNextRetry(duration time.Duration) {
	orig := r.delayFunc
	r.delayFunc = func(_ int) time.Duration {
		r.delayFunc = orig // restore original function
		return duration
	}
}
