/*
 * Copyright 2022 VMware, Inc.
 * SSPDX-License-Identifier: Apache-2.0
 */

export interface HarborModel {
  readonly apiVersion: 'goharbor.goharbor.io/v1alpha1',
  readonly kind: 'Setting',
  metadata: {
    name: string,
  },
  spec: {
    cache?: {
      address: string
      readonly kind: 'Redis',
      settings: {
        livingTime: number,
        skipTLSVerify: boolean
      }
    },
    dataSource: DataSourceType,
    knownRegistries?: knownRegistrieType[],
  },
  status: {
    status?: string
  }
}

export interface HarborModelResponse {
  items: HarborModel[]
}
interface DataSourceType {
  credentialRef: {
    name: string,
    namespace: string,
  },
  endpoint: string,
  name: string,
  readonly provider: 'Harbor',
  scanSchedule: string,
  skipTLSVerify: boolean
}

export interface knownRegistrieType {
  credentialRef : {
    name: string,
    namespace: string,
  },
  endpoint: string,
  name: string,
  provider: string,
  skipTLSVerify: boolean
}

export interface SecretModel {
  readonly apiVersion: 'v1',
  data: {
    accessKey: string,
    accessSecret: string
  },
  // immutable: true,
  readonly kind: 'Secret',
  metadata: {
    name: string,
    namespace: string,
    creationTimestamp: string
  },
  readonly type: 'Opaque'
}

export interface SecretModelResponse {
  items: SecretModel[]
}