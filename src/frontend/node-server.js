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
// const NAMESPACE= fs.readFile(`${SERVICEACCOUNT}/namespace`)
// const CACERT=fs.readFile(`${SERVICEACCOUNT}/ca.crt`)

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

app.listen(port)