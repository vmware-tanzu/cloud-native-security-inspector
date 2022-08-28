// Copyright 2022 VMware, Inc.
// SPDX-License-Identifier: Apache-2.0
const express = require('express')
const { createProxyMiddleware  } = require('http-proxy-middleware')
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
console.log('token', token)
let app = express()
app.use(history())
// static resource address
app.use(express.static(path.join(__dirname)))// html资源路径
app.set("views", __dirname); 
// convert ejs to html
app.engine('html',ejs.__express)
// Configure Template Engine
app.set("view engine", "html")
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
  secure: false }));

// Set the folder where the front-end project is located as a static resource
app.get('/', (req, res) => {
  res.render(data, {})
  console.log('render success')
})

app.listen(port)