package es

//func main() {
//	ctrlLog.SetFlags(0)
//	cert, _ := ioutil.ReadFile("/Users/zsimon/Projects/cnsi/github/elasticsearch/http_ca.crt")
//
//	var (
//		r  map[string]interface{}
//		wg sync.WaitGroup
//	)
//
//	// Initialize a Client with the default settings.
//	//
//	// An `ELASTICSEARCH_URL` environment variable will be used when exported.
//	//
//	cfg := elasticsearch.Config{
//		Addresses: []string{
//			"https://localhost:9201",
//		},
//		Username: "elastic",
//		Password: "vVPqNKbG-WjjukoIN4X5",
//		CACert:   cert,
//	}
//
//	es, err := elasticsearch.NewClient(cfg)
//	if err != nil {
//		ctrlLog.Fatalf("Error creating the Client: %s", err)
//	}
//
//	// 1. Get cluster info
//	//
//	res, err := es.Info()
//	if err != nil {
//		ctrlLog.Fatalf("Error getting response: %s", err)
//	}
//	defer res.Body.Close()
//	// Check response status
//	if res.IsError() {
//		ctrlLog.Fatalf("Error: %s", res.String())
//	}
//	// Deserialize the response into a map.
//	if err := json.NewDecoder(res.Body).Decode(&r); err != nil {
//		ctrlLog.Fatalf("Error parsing the response body: %s", err)
//	}
//	// Print Client and server version numbers.
//	ctrlLog.Printf("Client: %s", elasticsearch.Version)
//	ctrlLog.Printf("Server: %s", r["version"].(map[string]interface{})["number"])
//	ctrlLog.Println(strings.Repeat("~", 37))
//
//	// 2. Index documents concurrently
//	//
//	for i, title := range []string{"Test One", "Test Two"} {
//		wg.Add(1)
//
//		go func(i int, title string) {
//			defer wg.Done()
//
//			// Build the request body.
//			//data, err := json.Marshal(struct{ Title string }{Title: title})
//			var b strings.Builder
//			b.WriteString(`{"title": "`)
//			b.WriteString(title)
//			b.WriteString(`"}`)
//
//			if err != nil {
//				ctrlLog.Fatalf("Error marshaling document: %s", err)
//			}
//
//			// Set up the request object.
//			req := esapi.IndexRequest{
//				Index:      "test",
//				DocumentID: strconv.Itoa(i + 1),
//				//Body:       bytes.NewReader(data),
//				Body:    strings.NewReader(b.String()),
//				Refresh: "true",
//			}
//
//			// Perform the request with the Client.
//			res, err := req.Do(context.Background(), es)
//			if err != nil {
//				ctrlLog.Fatalf("Error getting response: %s", err)
//			}
//			defer res.Body.Close()
//
//			if res.IsError() {
//				ctrlLog.Printf("[%s] Error indexing document ID=%d", res.Status(), i+1)
//			} else {
//				// Deserialize the response into a map.
//				var r map[string]interface{}
//				if err := json.NewDecoder(res.Body).Decode(&r); err != nil {
//					ctrlLog.Printf("Error parsing the response body: %s", err)
//				} else {
//					// Print the response status and indexed document version.
//					ctrlLog.Printf("[%s] %s; version=%d", res.Status(), r["result"], int(r["_version"].(float64)))
//				}
//			}
//		}(i, title)
//	}
//	wg.Wait()
//
//	ctrlLog.Println(strings.Repeat("-", 37))
//
//	// 3. Search for the indexed documents
//
//	var buf bytes.Buffer
//	query := map[string]interface{}{
//		"query": map[string]interface{}{
//			"match": map[string]interface{}{
//				"title": "test",
//			},
//		},
//	}
//	if err := json.NewEncoder(&buf).Encode(query); err != nil {
//		ctrlLog.Fatalf("Error encoding query: %s", err)
//	}
//
//	// 执行搜索请求.
//	res, err = es.Search(
//		es.Search.WithContext(context.Background()),
//		es.Search.WithIndex("test"),
//		es.Search.WithBody(&buf),
//		es.Search.WithTrackTotalHits(true),
//		es.Search.WithPretty(),
//	)
//	if err != nil {
//		ctrlLog.Fatalf("Error getting response: %s", err)
//	}
//	defer res.Body.Close()
//
//	if res.IsError() {
//		var e map[string]interface{}
//		if err := json.NewDecoder(res.Body).Decode(&e); err != nil {
//			ctrlLog.Fatalf("Error parsing the response body: %s", err)
//		} else {
//			// Print the response status and error information.
//			ctrlLog.Fatalf("[%s] %s: %s",
//				res.Status(),
//				e["error"].(map[string]interface{})["type"],
//				e["error"].(map[string]interface{})["reason"],
//			)
//		}
//	}
//
//	if err := json.NewDecoder(res.Body).Decode(&r); err != nil {
//		ctrlLog.Fatalf("Error parsing the response body: %s", err)
//	}
//	// 打印响应状态，结果数和请求持续时间.
//	ctrlLog.Printf(
//		"[%s] %d hits; took: %dms",
//		res.Status(),
//		int(r["hits"].(map[string]interface{})["total"].(map[string]interface{})["value"].(float64)),
//		int(r["took"].(float64)),
//	)
//	// 打印每次匹配的ID和文档来源.
//	for _, hit := range r["hits"].(map[string]interface{})["hits"].([]interface{}) {
//		ctrlLog.Printf(" * ID=%s, %s", hit.(map[string]interface{})["_id"], hit.(map[string]interface{})["_source"])
//	}
//	ctrlLog.Println(strings.Repeat("=", 37))
//}
