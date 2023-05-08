// Copyright 2022 VMware, Inc.
// SPDX-License-Identifier: Apache-2.0
const express = require('express')
const request = require('request');
const bodyParser = require('body-parser')
const ejs = require('ejs')
const path = require('path')
const history = require('connect-history-api-fallback');
const fs = require('fs')
const port = 3800
const APISERVER='https://kubernetes.default.svc'
const SERVICEACCOUNT='/var/run/secrets/kubernetes.io/serviceaccount'
const { Client } = require('@opensearch-project/opensearch')
const elastic = require('@elastic/elasticsearch')
const elasticClient = elastic.Client
const pathObj = {
  harbor: {
    path: '/apis/goharbor.goharbor.io/v1alpha1/settings',
    update: (name) => {
      return '/apis/goharbor.goharbor.io/v1alpha1/settings/' + name
    }
  }
}

// set up rate limiter: maximum of five requests per minute
const RateLimit = require('express-rate-limit');

let app = express()
// parse application/json
app.use(bodyParser.json())
app.use(history())
// static resource address
app.use(express.static(path.join(__dirname)))// html datasource
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.set("views", __dirname); 
// convert ejs to html
app.engine('html',ejs.__express)
// Configure Template Engine
app.set("view engine", "html")
const limiter = RateLimit({
  windowMs: 1*60*1000, // 1 minute
  max: 5
})
// apply rate limiter to all requests
app.use(limiter);

// Please comment this line for development environment
let token = fs.readFileSync(`${SERVICEACCOUNT}/token`, 'utf8')
app.use('/k8s-body/:type', (req, res) => {
  const query = req.query
  const type = req.params.type


  const method = req.method
  // const  path = new URL(query.name, APISERVER).pathname;

  const options = {
    url: APISERVER,
    method: method,
    headers: {
      'Accept':  'application/json',
      'Authorization': `Bearer ${token}`
    },
    ca: fs.readFileSync(`${SERVICEACCOUNT}/ca.crt`, 'utf8')
  }
  if (query.name) {
    options.url += pathObj[type].update(query.name)
  } else {
    options.url += pathObj[type].path
  }
  if (method === 'POST') {
    let body = JSON.parse(req.body.data)
    if (!validation(body)) {
      res.status(501).send('wrong data entered');
      return false
    }
    if (type === 'secret') {
      const secret = {
        data: {
        },
        kind: 'Secret',
        metadata: {
          name: body.name,
          namespace: body.namespace,
          annotations: {
            type: body.type
          }
        },
        type: 'Opaque'
      }
      if (body.key) {
        secret.data.accessKey = body.key
        secret.data.accessSecret = body.value
      } else if (body.token){
        secret.data.API_TOKEN = body.token
      }
      body = secret
    } else if (type === 'harbor') {
      const harbor = {
        apiVersion: 'goharbor.goharbor.io/v1alpha1',
        kind: 'Setting',
        metadata: {
          name: body.name
        },
        spec: {
          dataSource: {
            credentialRef: {
              name: body.data_source_credential_name,
              namespace: body.data_source_credential_namespace,
            },
            endpoint: body.data_source_endpoint,
            name: body.data_source_name,
            provider: 'Harbor',
            scanSchedule: body.data_source_scanSchedule,
            skipTLSVerify: body.data_source_skipTLSVerify
          },
        },
        status: {}
      }
      if (body.cache_address) {
        harbor.spec.cache ={
          address: body.cache_address,
          kind: 'Redis',
          settings: {
            livingTime: body.cache_livingTime,
            skipTLSVerify: body.cache_skipTLSVerify
          }
        }
      }
      if (body.knownRegistries) {
        harbor.spec.knownRegistries=body.knownRegistries
      }
      if (body.vac_endpoint) {
        harbor.spec.vacDataSource = {
          endpoint: body.vac_endpoint,
          credentialRef: {
            name: body.vac_name,
            namespace: body.namespace,
          }
        }
      }
      body = harbor
    } else if (type === 'policy') {
      const policy = {
        apiVersion: "goharbor.goharbor.io/v1alpha1",
        kind: "InspectionPolicy",
        metadata: {
          name: body.name,
        },
        spec: {
          enabled: body.enabled,
          settingsName: body.settingsName,
          workNamespace: body.workNamespace,
          schedule: body.schedule,
          strategy: {
            concurrencyRule: body.strategy_concurrencyRule,
            historyLimit: body.strategy_historyLimit,
            suspend: body.strategy_suspend
          },
          inspector: {
            imagePullPolicy: body.inspector_imagePullPolicy,
            imagePullSecrets: [],
            exportConfig: {
              openSearch: {
                hostport: body.inspector_openSearch_hostport,
                username: body.inspector_openSearch_username,
                password: body.inspector_openSearch_password,
                checkCert: false,
                mutualTLS: false
              }
            }
          },
          inspection: {
            baselines: body.inspection_baselines,
            namespaceSelector: {
              matchExpressions: [],
              matchLabels: body.inspection_namespaceSelector.matchLabels
            },
            workloadSelector: {
              matchExpressions: [],
              matchLabels: body.inspection_workloadSelector.matchLabels
            }
          },
          vacAssessmentEnabled: body.vacAssessmentEnabled
        }
      }

      if (body.inspector_image) {
        policy.spec.inspector.image = body.inspector_image
      }
      if (body.inspector_kubebenchImage) {
        policy.spec.inspector.kubebenchImage = body.inspector_kubebenchImage
      }
      if (body.inspector_riskImage) {
        policy.spec.inspector.riskImage= body.inspector_riskImage
      }

      if (body.inspection_actions) {
        policy.spec.inspection.actions = body.inspection_actions
      }

      body = policy
    }
    options.body = JSON.stringify(body)
  } else if (method === 'PUT') {
    const body = JSON.parse(req.body.data)
    options.body = JSON.stringify(body)
  }

  request(options, function (error, response, body) {
    if (!error && response.statusCode >= 200 && response.statusCode < 300) {
      let headers = response.headers;
      res.setHeader('content-type',headers['content-type']);
      res.send(body);
    } else {
      console.log('error', error)
      res.status(501).send(options)
    }
  });
})

// Set the folder where the front-end project is located as a static resource
app.get('/', (req, res) => {
  res.render(data, {})
})

app.post('/open-search', (req, res) => {
  const body = req.body
  console.log('body', body)

  if (body.client === 'opensearch') {
    const client = new Client({
      // The development environment replaces the 'body.url' address
      node: body.url,
      ssl: {
        rejectUnauthorized: false
      },
      auth: {
        username: body.username,
        password: body.password
      }
  
    });
    open_search(client, body).then(v => {
      res.status(200).send(v) 
    }).catch(err => {
      res.status(500).send(err.message) 
    })
  } else if (body.client === 'risk_opensearch') {
    const client = new Client({
      // The development environment replaces the 'body.url' address
      node: body.url,
      ssl: {
        rejectUnauthorized: false
      },
      auth: {
        username: body.username,
        password: body.password
      }
  
    });
    risk_open_serach(client, body).then(v => {
      res.status(200).send(v) 
    }).catch(err => {
      res.status(500).send(err.message) 
    })
  } else {
    const client = new elasticClient({
      node: body.url,
      tls: {
        ca: body.ca,
        rejectUnauthorized: false
      },
      auth: {
        username: body.username,
        password: body.password
      }
    })
    elastic_search(client, body).then(v => {
      res.status(200).send(v) 

    }).catch(err => {
      res.status(500).send(err.message) 
    })  }

})

open_search = async (client, body) => { 
  let query = { 
    query: { 
      match: { 
        createTime: {
          query: "2022-11-23T07:45:18Z",
        },
      }, 
    }, 
    size: 10,
    from: 4
  }; 
  try {
    let response = await client.search({ index: body.index, body: body.query }); 
    console.log("Searching:"); 
    return  response.body
  } catch (error) {
    console.log(error)
    throw error
  }
}

elastic_search = async (client, body) => { 
  let query = { 
    query: { 
      match: { 
        createTime: {
          query: "2022-11-23T07:45:18Z",
        },
      }, 
    }, 
    size: 10,
    from: 4
  }; 
  try {
    let response = await client.search({ index: body.index, body: body.query }); 
    console.log("Searching:"); 
    console.log("response:", response); 
    console.log("response.body:", response.body); 
    return  response
  } catch (error) {
    console.log(error)
    throw error
  }}

risk_open_serach = async (client, body) => {
  let response = await client.get(
    {
      id: body.query,
      index: body.index, 
    }
  )
  console.log("Searching:"); 
  return  response.body
}

app.listen(port, console.log(3800))


function validation (object) {
  let result = true
  for (const key in object) {
    if (typeof object[key] === 'string' && !object[key].trim()) {
      result = false
      break
    }
  }
  return result
}