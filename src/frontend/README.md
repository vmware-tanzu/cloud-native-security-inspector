Frontend Developer Guide For Cloud Native Security Inspector
============
This is a project to build a cloud-native security inspector frontend based on Clarity and Angular.



Premise
============
1. Prepare in advance to run the Cloud Native Security Inspector environment normally
2. The following two commands need to be executed in the environment terminal where Cloud Native Security Inspector is running

```bash
# This command can directly skip the kubernetes account password, certificate verification and access the kubernetes API externally

$ kubectl proxy --port 8082 --address='0.0.0.0'  --accept-hosts '.*'

# This command can access opensearch data externally

$ kubectl port-forward -n opensearch service/opensearch-cluster-master 9999:9200 --address='0.0.0.0'
```

3. Open the '[proxy.config.json](./proxy.config.json)' file under the directory 'frontend' and replace 'hostname' with an available Cloud Native Security Inspector hostname
```json
  {
    "/proxy": {
      "target": "hostname:8082",
      "logLevel": "debug", 
      "secure": false,
      "changeOrigin": true,
      "pathRewrite": {
          "^/proxy": ""
      }
    },
    "/open": {
      "target": "http://localhost:3800",
      "logLevel": "debug", 
      "secure": false,
      "changeOrigin": true,
      "pathRewrite": {
          "^/open": ""
      }
    }
  }
```

4. Dependencies required to install node server separately, first open the src/frontend terminal in the Cloud Native Security Inspector project directory
```bash
$ cd src/frontend 

$ npm install connect-history-api-fallback@1.6.0 ejs@3.1.6 express@4.17.2 http-proxy-middleware@2.0.6 https@1.0.0 request@2.88.2 supervisor@0.12.0 @opensearch-project/opensearch@2.1.0 @elastic/elasticsearch@8.5.0
```

5. Open the '[node-server.js](./node-server.js)' file under the "frontend" directory, comment the code as 'Please comment this line for development environment', and replace the variable 'body.url' with the hostname of the running Cloud Native Security Inspector: 9999

```js
  // Please comment this line for development environment
  let token = fs.readFileSync(`${SERVICEACCOUNT}/token`, 'utf8')

  app.use('/proxy', createProxyMiddleware({ 
    // Forward to kubernetes api-service
    target: APISERVER,
    // Rewrite path when forwarding
    pathRewrite: {'^/proxy' : ''},
    headers: {
      // Please comment this line for development environment
      'Authorization': `Bearer ${token}`
    },
    ssl: {
      // Please comment this line for development environment
      ca: fs.readFileSync(`${SERVICEACCOUNT}/ca.crt`, 'utf8')
    },
    changeOrigin: true,
    secure: false,
    onProxyReq: fixRequestBody
  }));

  // The development environment replaces the 'body.url' address
  node: body.url,
```

6. Execute node node-server.js in the terminal

```bash
$ node node-server.js

# run successfully

$ [HPM] Proxy created: /  -> https://kubernetes.default.svc
$ [HPM] Proxy rewrite rule created: "^/proxy" ~> "
```

7. When accessing the kubebench or risk report page through the UI, you will encounter a request status code of 404, and you need to open the '[assessment.service.ts](./src/app/service/assessment.service.ts)' file 'frontend/src/app/service' directory, and make the following changes
```ts
  getKubeBenchReport (data: {url: string, index: string, username: string, password: string, query: any, client: string, ca: string}) :Observable<any>{
    return this.http.post<any>('/open/open-search', data)
  }

```


Start
============
1. npm install (need to be performed in the frontend directory)
2. npm start (all dependencies are installed successfully, run this command to start the project)
3. open your browser on http://localhost:4004

Notice
============
Possible problems when starting the frontend.

1. Installation dependencies in mainland China may encounter problems with installation failures, you can try to execute the following commands
```bash
$ npm get registry
# Set as Taobao source
$ npm config set registry https://registry.npm.taobao.org
```
