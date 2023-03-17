package retry_test

import (
	"context"
	"fmt"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/lib/retry"
	"testing"
	"time"
)

func TestSuccessCase(t *testing.T) {
	var count int
	err := retry.NewRetry().Run(context.Background(), func() (bool, error) {
		count++
		return true, nil
	})
	if err != nil {
		t.Fatal(err)
	}
	if got, want := count, 1; got != want {
		t.Errorf("unexpected executions count, got: %d, want: %d", got, want)
	}
}

func TestWithMaxAttempts(t *testing.T) {
	testCases := []struct {
		maxAttempts int
	}{
		{maxAttempts: 1},
		{maxAttempts: 3},
		{maxAttempts: 10},
	}
	for _, tc := range testCases {
		t.Run(fmt.Sprintf("%d attempts", tc.maxAttempts), func(t *testing.T) {
			var count int
			if err := retry.NewRetry(
				retry.WithMaxAttempts(tc.maxAttempts),
				retry.WithFixedDelay(10*time.Millisecond),
			).Run(context.Background(), func() (bool, error) {
				count++
				return count == tc.maxAttempts, nil
			}); err != nil {
				t.Fatal(err)
			}
			if got, want := count, tc.maxAttempts; got != want {
				t.Errorf("expected function to be executed %d, got: %d", want, got)
			}
		})
	}
}
