package main

import (
	"log"
	"net/http"
)

func main() {
	log.Println("Starting up")
	http.HandleFunc("/", handler)
	http.ListenAndServe(":8080", nil)
}

func handler(w http.ResponseWriter, req *http.Request) {
	if req.URL.Path == "/data.js" {
		w.Write(getVisitsAndCaptures())
		return
	}
	log.Println("GET file:", req.URL.Path)
	http.ServeFile(w, req, "static/"+req.URL.Path)
}
