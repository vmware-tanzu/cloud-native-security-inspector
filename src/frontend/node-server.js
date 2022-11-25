// Copyright 2022 VMware, Inc.
// SPDX-License-Identifier: Apache-2.0
const express = require('express')
const https = require('https')
const request = require('request');
const { createProxyMiddleware, fixRequestBody  } = require('http-proxy-middleware')
const bodyParser = require('body-parser')
const ejs = require('ejs')
const path = require('path')
const history = require('connect-history-api-fallback');
const fs = require('fs')
const port = 3800
const APISERVER='https://kubernetes.default.svc'
const SERVICEACCOUNT='/var/run/secrets/kubernetes.io/serviceaccount'
const { Client } = require('@opensearch-project/opensearch')

let token = fs.readFileSync(`${SERVICEACCOUNT}/token`, 'utf8')
let app = express()
// Forward processing of requests starting with /api
app.use('/proxy', createProxyMiddleware({ 
	// Forward to kubernetes api-service
	target: APISERVER,
	// Rewrite path when forwarding
	pathRewrite: {'^/proxy' : ''},
  headers: {
    'Authorization': `Bearer ${token}`
  },
  ssl: {
    ca: fs.readFileSync(`${SERVICEACCOUNT}/ca.crt`, 'utf8')
  },
	changeOrigin: true,
  secure: false,
  onProxyReq: fixRequestBody
}));
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


// Set the folder where the front-end project is located as a static resource
app.get('/', (req, res) => {
  res.render(data, {})
})

app.post('/es-test', (req, res) => {
  const body = req.body
  const httpsAgent = new https.Agent({
    ca: body.cert,
  })
  config = {}
  config['headers'] = {
    'Accept':  'application/json',
    'Authorization':'Basic '+ body.basic
  }
  config['httpsAgent'] = httpsAgent
  const options = {
    url: body.url,
    ca: body.cert,
    // rejectUnauthorized : false,
    strictSSL: false,
    headers: {
      'Accept':  'application/json',
      'Authorization':'Basic '+ body.basic
    }
  };
  console.log('body', body)
  console.log('options', options)
  const response = request.get(options)
  response.on('error', err => {
    console.log(1, err)
    res.status(501).send('test failed')
  })
  response.on('data', data => {
    console.log(2, data)
    res.status(501).send('test failed')
  })
  response.on('response', response => {
    console.log(3, response.statusCode)
    res.status(response.statusCode).send('test result')
  })
})

app.post('/open-search', (req, res) => {
  const body = req.body
  console.log('body', body)
  const client = new Client({
    node: body.url,
    ssl: {
      rejectUnauthorized: false
    },
    auth: {
      username: body.username,
      password: body.password
    }

  });
  test_search(client, body).then(v => {
    res.status(200).send(v) 
  }).catch(err => {
    res.status(500).send(err) 
  })

})

test_search = async (client, body) => { 
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
    console.log(response.body); 
    return  response.body
  } catch (error) {
    console.log(error)
    throw error
  }
}

app.listen(port)