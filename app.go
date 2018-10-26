package main

import (
	"log"
	"net/http"
	"os"
)

func main() {
	log.Println("Starting up")
	http.HandleFunc("/", handler)
	http.ListenAndServe(":8080", nil)
}

func handler(w http.ResponseWriter, req *http.Request) {
	log.Println("GET file:", req.URL.Path)
	if req.URL.Path == "/data.json" {
		if _, err := os.Stat("dump/data.json"); !os.IsNotExist(err) {
			log.Println("→ found locally")
			http.ServeFile(w, req, "dump/data.json")
		} else {
			log.Println("→ generating now")
			w.Header().Add("Cache-Control", "no-cache")
			w.Write(getVisitsAndCaptures())
		}
		return
	}
	http.ServeFile(w, req, "static/"+req.URL.Path)
}
