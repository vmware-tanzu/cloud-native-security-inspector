/*
 * Copyright 2022 VMware, Inc.
 * SSPDX-License-Identifier: Apache-2.0
 */

// AssessmentReportType
export interface AssessmentReportType {
  apiVersion: string,
  items: AssessmentType[],
  kind: string,
  metadata: {
    continue: string,
    remainingItemCount: number,
    resourceVersion: string,
    selfLink: string
  }
}

export interface AssessmentType {
  apiVersion: string,
  kind: string,
  metadata: MetadataShardType
  spec: AssessmentSpecType,
  status: any
}

interface AssessmentSpecType {
  inspectionConfiguration: {
    actions: ActionType[],
    assessment: {
      format: string,
      generate: boolean,
      liveTime: number,
      managedBy: boolean
    },
    baselines: BaselineType[],
    dataProvider: {
      cache: {
        address: string,
        credential: {
          accessKey: string,
          accessSecret: string
        },
        database: number,
        kind: string,
        settings: {
          livingTime: number,
          skipTLSVerify: boolean
        }
      },
      connection: {
        insecure: boolean
      },
      credential: {
        accessKey: string,
        accessSecret: string
      },
      endpoint: string,
      provider: string
    },
    namespaceSelector: {
      matchExpressions: MatchExpressionType[],
      matchLabels: {
        additionalProp1: string,
        additionalProp2: string,
        additionalProp3: string
      }
    },
    workloadSelector: {
      matchExpressions: MatchExpressionType[],
      matchLabels: {
        additionalProp1: string,
        additionalProp2: string,
        additionalProp3: string
      }
    }
  },
  namespaceAssessments: NamespaceAssessmentType[]
}
// InspectionPolicyType
export interface InspectionPolicyType {
  apiVersion: string,
  items: PolicyType[],
  kind: string,
  metadata: {
    continue: string,
    remainingItemCount: number,
    resourceVersion: string,
    selfLink: string
  }
}

interface PolicyType {
  apiVersion: string,
  kind: string,
  metadata: MetadataShardType
  spec: PolicySpecType,
  status: PolicyStatusType
}

interface PolicySpecType {
  inspection: {
    actions: ActionType[],
    assessment: {
      format: string,
      generate: boolean,
      liveTime: number,
      managedBy: boolean
    },
    baselines: BaselineType[],
    dataProvider: {
      cache: {
        address: string,
        credential: {
          accessKey: string,
          accessSecret: string
        },
        database: number,
        kind: string,
        settings: {
          livingTime: number,
          skipTLSVerify: boolean
        }
      },
      connection: {
        insecure: boolean
      },
      credential: {
        accessKey: string,
        accessSecret: string
      },
      endpoint: string,
      provider: string
    },
    namespaceSelector: {
      matchExpressions: MatchExpressionType[],
      matchLabels: {
        additionalProp1: string,
        additionalProp2: string,
        additionalProp3: string
      }
    },
    workloadSelector: {
      matchExpressions: MatchExpressionType[],
      matchLabels: {
        additionalProp1: string,
        additionalProp2: string,
        additionalProp3: string
      }
    }
  },
  inspector: {
    image: string,
    imagePullPolicy: string,
    imagePullSecrets: any[]
  },
  schedule: string
  strategy: {
    concurrencyRule: string,
    historyLimit: number,
    suspend: boolean
  },
  workNamespace: string
}

interface PolicyStatusType {
  executor: {
    apiVersion: string,
    fieldPath: string,
    kind: string,
    name: string,
    namespace: string,
    resourceVersion: string,
    uid: string
  },
  status: string
}

interface MetadataShardType {
  annotations:{[key:string]:string},
  clusterName: string,
  creationTimestamp: any,
  deletionGracePeriodSeconds: number,
  deletionTimestamp?: string,
  finalizers: string[],
  generateName: string,
  generation: number,
  labels: {
    additionalProp1: string,
    additionalProp2: string,
    additionalProp3: string
  },
  managedFields: ManagedFieldType[],
  name: string,
  namespace: string,
  ownerReferences: OwnerReferencesType[],
  resourceVersion: string,
  selfLink: string,
  uid: string
}
// PolicyItemType
export interface PolicyItemType {
  apiVersion: string,
  kind: string,
  metadata: MetadataShardType
  spec: PolicySpecType
  status: PolicyStatusType
}

// Inspection
export interface InspectionType {
  apiVersion: string,
  items: InspectionItemType[],
  kind: string,
  metadata: {
    continue: string,
    remainingItemCount: number,
    resourceVersion: string,
    selfLink: string
  }
}

// InspectionItemType
export interface InspectionItemType {
  apiVersion: string,
  kind: string,
  metadata: MetadataShardType
  spec: InspectionSpecType,
  status: InspectionStatusType
}

interface InspectionSpecType{
  foo: string
}
interface InspectionStatusType{
  conditions:       {
    lastTransitionTime: string,
    message: string,
    observedGeneration: number,
    reason: string,
    status: string,
    type: string
  }[]
}

interface ManagedFieldType {
  apiVersion: string,
  fieldsType: string,
  fieldsV1: {},
  manager: string,
  operation: string,
  subresource: string,
  time: string
}

interface OwnerReferencesType {
  apiVersion: string,
  blockOwnerDeletion: boolean,
  controller: boolean,
  kind: string,
  name: string,
  uid: string
}

interface ActionType {
  ignore: {
    matchExpressions: MatchExpressionType[],
    matchLabels: {
      additionalProp1: string,
      additionalProp2: string,
      additionalProp3: string
    }
  },
  kind: string,
  settings: {
    additionalProp1: string,
    additionalProp2: string,
    additionalProp3: string
  }
}

interface ActionEnforcementType {
  action: ActionType,
  result: {
    error: string,
    status: string
  }
}

interface MatchExpressionType {
  key: string,
  operator: string,
  values: string[]
}

interface FailureType {
  assessmentError: {
    cause: string,
    code: number,
    error: string
  },
  baseline: {
    baseline: string,
    kind: string,
    scheme: string,
    version: string
  },
  container: {
    id: string,
    image: string,
    imageID: string,
    isInit: boolean,
    name: string
  }
}
interface ContainerType {
  id: string,
  image: string,
  imageID: string,
  isInit: boolean,
  name: string
}

interface PodType {
  containers: ContainerType[],
  metadata: {
    apiVersion: string,
    fieldPath: string,
    kind: string,
    name: string,
    namespace: string,
    resourceVersion: string,
    uid: string
  }
}

interface WorkloadAssessmentType {
  actionEnforcements: ActionEnforcementType[],
  failures: FailureType[],
  passed: boolean,
  workload: {
    metadata: {
      apiVersion: string,
      fieldPath: string,
      kind: string,
      name: string,
      namespace: string,
      resourceVersion: string,
      uid: string
    },
    pods: PodType[]
  }
}

interface NamespaceAssessmentType {
  namespace: {
    name: string
  },
  workloadAssessments: WorkloadAssessmentType[]
}

interface BaselineType {
  baseline: string,
  kind: string,
  scheme: string,
  version: string
}

export interface NameSpaceSourceModel {
  metadata: {
    name: string
    creationTimestamp: any
    labels: {[key:string]:string}
    resourceVersion:string
  }
  status: {
    phase:string
  }
}

export interface NamespaceModel {
  name: string
  creationTimestamp: any
  labels: {[key:string]:string}
  resourceVersion:string
  status: string
  workloads: {
    workloads: [
      {
        name: 'Deployment',
        workloadList: any[],
        violationList: any[]
      },
      {
        name: 'ReplicaSet',
        workloadList: any[],
        violationList: any[]
      },
      {
        name: 'StatefulSet',
        workloadList: any[],
        violationList: any[]
      },
      {
        name: 'DaemonSet',
        workloadList: any[],
        violationList: any[]
      },
      {
        name: 'CronJob',
        workloadList: any[],
        violationList: any[]
      },
      {
        name: 'Job',
        workloadList: any[],
        violationList: any[]
      }
    ],
    violationList: any[]
    normal: number,
    abnormal: number,
    compliant: number
  }
}

