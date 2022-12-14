// Copyright 2022 VMware, Inc.
// SPDX-License-Identifier: Apache-2.0
// Code generated by go-swagger; DO NOT EDIT.

package assessment

// This file was generated by the swagger tool.
// Editing this file might prove futile when you re-run the swagger generate command

import (
	"context"

	"github.com/go-openapi/runtime"

	strfmt "github.com/go-openapi/strfmt"
)

//go:generate mockery -name API -inpkg

// API is the interface of the assessment client
type API interface {
	/*
	   GetNSAssessment gets inspection policy info under the namespace

	   The related assessments of the workloads under the namespace are returned*/
	GetNSAssessment(ctx context.Context, params *GetNSAssessmentParams) (*GetNSAssessmentOK, error)
	/*
	   ListNamespaces lists all the namespaces with inspection policies from the k8s cluster*/
	ListNamespaces(ctx context.Context, params *ListNamespacesParams) (*ListNamespacesOK, error)
}

// New creates a new assessment API client.
func New(transport runtime.ClientTransport, formats strfmt.Registry, authInfo runtime.ClientAuthInfoWriter) *Client {
	return &Client{
		transport: transport,
		formats:   formats,
		authInfo:  authInfo,
	}
}

/*
Client for assessment API
*/
type Client struct {
	transport runtime.ClientTransport
	formats   strfmt.Registry
	authInfo  runtime.ClientAuthInfoWriter
}

/*
GetNSAssessment gets inspection policy info under the namespace

The related assessments of the workloads under the namespace are returned
*/
func (a *Client) GetNSAssessment(ctx context.Context, params *GetNSAssessmentParams) (*GetNSAssessmentOK, error) {

	result, err := a.transport.Submit(&runtime.ClientOperation{
		ID:                 "getNSAssessment",
		Method:             "GET",
		PathPattern:        "/namespaces/{ns}/assessments/{policy}",
		ProducesMediaTypes: []string{"application/json"},
		ConsumesMediaTypes: []string{"application/json"},
		Schemes:            []string{"http", "https"},
		Params:             params,
		Reader:             &GetNSAssessmentReader{formats: a.formats},
		AuthInfo:           a.authInfo,
		Context:            ctx,
		Client:             params.HTTPClient,
	})
	if err != nil {
		return nil, err
	}
	return result.(*GetNSAssessmentOK), nil

}

/*
ListNamespaces lists all the namespaces with inspection policies from the k8s cluster
*/
func (a *Client) ListNamespaces(ctx context.Context, params *ListNamespacesParams) (*ListNamespacesOK, error) {

	result, err := a.transport.Submit(&runtime.ClientOperation{
		ID:                 "listNamespaces",
		Method:             "GET",
		PathPattern:        "/namespaces",
		ProducesMediaTypes: []string{"application/json"},
		ConsumesMediaTypes: []string{"application/json"},
		Schemes:            []string{"http", "https"},
		Params:             params,
		Reader:             &ListNamespacesReader{formats: a.formats},
		AuthInfo:           a.authInfo,
		Context:            ctx,
		Client:             params.HTTPClient,
	})
	if err != nil {
		return nil, err
	}
	return result.(*ListNamespacesOK), nil

}
