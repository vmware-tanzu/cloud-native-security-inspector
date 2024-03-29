// Code generated by mockery v2.20.0. DO NOT EDIT.

package mocks

import (
	context "context"

	kubernetes "k8s.io/client-go/kubernetes"

	mock "github.com/stretchr/testify/mock"
)

// Provider is an autogenerated mock type for the Provider type
type Provider struct {
	mock.Mock
}

// GetBearerToken provides a mock function with given fields: _a0, _a1, _a2, _a3
func (_m *Provider) GetBearerToken(_a0 kubernetes.Interface, _a1 context.Context, _a2 string, _a3 string) (string, error) {
	ret := _m.Called(_a0, _a1, _a2, _a3)

	var r0 string
	var r1 error
	if rf, ok := ret.Get(0).(func(kubernetes.Interface, context.Context, string, string) (string, error)); ok {
		return rf(_a0, _a1, _a2, _a3)
	}
	if rf, ok := ret.Get(0).(func(kubernetes.Interface, context.Context, string, string) string); ok {
		r0 = rf(_a0, _a1, _a2, _a3)
	} else {
		r0 = ret.Get(0).(string)
	}

	if rf, ok := ret.Get(1).(func(kubernetes.Interface, context.Context, string, string) error); ok {
		r1 = rf(_a0, _a1, _a2, _a3)
	} else {
		r1 = ret.Error(1)
	}

	return r0, r1
}

type mockConstructorTestingTNewProvider interface {
	mock.TestingT
	Cleanup(func())
}

// NewProvider creates a new instance of Provider. It also registers a testing interface on the mock and a cleanup function to assert the mocks expectations.
func NewProvider(t mockConstructorTestingTNewProvider) *Provider {
	mock := &Provider{}
	mock.Mock.Test(t)

	t.Cleanup(func() { mock.AssertExpectations(t) })

	return mock
}
