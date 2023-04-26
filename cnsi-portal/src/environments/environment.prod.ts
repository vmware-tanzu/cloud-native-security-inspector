/*
 * Copyright 2022 VMware, Inc.
 * SSPDX-License-Identifier: Apache-2.0
 */

export const environment = {
  production: true,
  api: {
    goharbor: '/proxy/apis/goharbor.goharbor.io/v1alpha1',
    k8s: '/proxy/api/v1',
    apiregistration: '/proxy/apis/apiregistration.k8s.io/v1',
    k8sPost: '/k8s-body'   
  }
};
