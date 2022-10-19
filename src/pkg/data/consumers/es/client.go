package es

import (
	elasticsearch "github.com/elastic/go-elasticsearch/v8"
	"log"
	"sync"
)

var (
	lock   = &sync.Mutex{}
	client *elasticsearch.Client
)

func NewClient(cert []byte, addr string, username string, passwd string) *elasticsearch.Client {
	lock.Lock()
	defer lock.Unlock()
	if client == nil {
		cfg := elasticsearch.Config{
			Addresses: []string{
				addr,
			},
			Username: username,
			Password: passwd,
			CACert:   cert,
		}
		var err error
		client, err = elasticsearch.NewClient(cfg)
		if err != nil {
			log.Fatalf("Error creating the Client: %s", err)
		}
	}
	return client

}

//var (
//	certFile  string
//	esAddress string
//	username  string
//	password  string
//)

//func main() {
//	certFile = "/Users/zsimon/Projects/cnsi/github/elasticsearch/http_ca.crt"
//	esAddress = "https://localhost:9201"
//	username = "elastic"
//	password = "vVPqNKbG-WjjukoIN4X5"
//
//	var (
//		r  map[string]interface{}
//		wg sync.WaitGroup
//	)
//	cert, _ := ioutil.ReadFile(certFile)
//	es := NewClient(cert, esAddress, username, password)
//	res, err := es.Info()
//	if err != nil {
//		log.Fatalf("Error getting response: %s", err)
//	}
//
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
//				log.Fatalf("Error marshaling document: %s", err)
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
//				log.Fatalf("Error getting response: %s", err)
//			}
//			defer res.Body.Close()
//
//			if res.IsError() {
//				log.Printf("[%s] Error indexing document ID=%d", res.Status(), i+1)
//			} else {
//				// Deserialize the response into a map.
//				var r map[string]interface{}
//				if err := json.NewDecoder(res.Body).Decode(&r); err != nil {
//					log.Printf("Error parsing the response body: %s", err)
//				} else {
//					// Print the response status and indexed document version.
//					log.Printf("[%s] %s; version=%d", res.Status(), r["result"], int(r["_version"].(float64)))
//				}
//			}
//		}(i, title)
//	}
//	wg.Wait()
//
//	// index
//	//for i, title := range []string{"Test One", "Test Two"} {
//	//	wg.Add(1)
//	//
//	//	go func(i int, title string) {
//	//		defer wg.Done()
//	//
//	//		// Build the request body.
//	//		data, err := json.Marshal(struct{ Title string }{Title: title})
//	//		if err != nil {
//	//			ctrlLog.Fatalf("Error marshaling document: %s", err)
//	//		}
//	//
//	//		// Set up the request object.
//	//		req := esapi.IndexRequest{
//	//			Index:      "test",
//	//			DocumentID: strconv.Itoa(i + 1),
//	//			Body:       bytes.NewReader(data),
//	//			Refresh:    "true",
//	//		}
//	//
//	//		// Perform the request with the Client.
//	//		res, err := req.Do(context.Background(), es)
//	//		if err != nil {
//	//			ctrlLog.Fatalf("Error getting response: %s", err)
//	//		}
//	//		defer res.Body.Close()
//	//
//	//		if res.IsError() {
//	//			ctrlLog.Printf("[%s] Error indexing document ID=%d", res.Status(), i+1)
//	//		} else {
//	//			// Deserialize the response into a map.
//	//			var r map[string]interface{}
//	//			if err := json.NewDecoder(res.Body).Decode(&r); err != nil {
//	//				ctrlLog.Printf("Error parsing the response body: %s", err)
//	//			} else {
//	//				// Print the response status and indexed document version.
//	//				ctrlLog.Printf("[%s] %s; version=%d", res.Status(), r["result"], int(r["_version"].(float64)))
//	//			}
//	//		}
//	//	}(i, title)
//	//}
//	//wg.Wait()
//
//	log.Println(strings.Repeat("-", 37))
//
//	// 3. Search for the indexed documents
//	//
//	// Build the request body.
//	var buf bytes.Buffer
//	query := map[string]interface{}{
//		"query": map[string]interface{}{
//			"match": map[string]interface{}{
//				"title": "Test One",
//			},
//		},
//	}
//	if err := json.NewEncoder(&buf).Encode(query); err != nil {
//		log.Fatalf("Error encoding query: %s", err)
//	}
//	// Perform the search request.
//	res, err = es.Search(
//		es.Search.WithContext(context.Background()),
//		es.Search.WithIndex("test"),
//		es.Search.WithBody(&buf),
//		es.Search.WithTrackTotalHits(true),
//		es.Search.WithPretty(),
//	)
//	if err != nil {
//		log.Fatalf("Error getting response: %s", err)
//	}
//	defer res.Body.Close()
//
//	if res.IsError() {
//		var e map[string]interface{}
//		if err := json.NewDecoder(res.Body).Decode(&e); err != nil {
//			log.Fatalf("Error parsing the response body: %s", err)
//		} else {
//			// Print the response status and error information.
//			log.Fatalf("[%s] %s: %s",
//				res.Status(),
//				e["error"].(map[string]interface{})["type"],
//				e["error"].(map[string]interface{})["reason"],
//			)
//		}
//	}
//
//	if err := json.NewDecoder(res.Body).Decode(&r); err != nil {
//		log.Fatalf("Error parsing the response body: %s", err)
//	}
//	// Print the response status, number of results, and request duration.
//	log.Printf(
//		"[%s] %d hits; took: %dms",
//		res.Status(),
//		int(r["hits"].(map[string]interface{})["total"].(map[string]interface{})["value"].(float64)),
//		int(r["took"].(float64)),
//	)
//	// Print the ID and document source for each hit.
//	for _, hit := range r["hits"].(map[string]interface{})["hits"].([]interface{}) {
//		log.Printf(" * ID=%s, %s", hit.(map[string]interface{})["_id"], hit.(map[string]interface{})["_source"])
//	}
//
//	log.Println(strings.Repeat("=", 37))
//
//}
