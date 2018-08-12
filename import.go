package main

import (
	"encoding/csv"
	"encoding/json"
	"log"
	"os"
	"strings"
)

const open = "["
const close = "]"
const seperator = ","

func readFile() ([][]string, error) {
	var err error
	file, err := os.Open("dump/game_log.tsv")
	if err != nil {
		return nil, err
	}

	//sed -i 's/None\tNone$/None/g' game_log.tsv

	// Initialize our csv reader
	csvReader := csv.NewReader(file)
	csvReader.Comma = '\t'
	csvReader.LazyQuotes = true

	// Read the data
	if content, err := csvReader.ReadAll(); err == nil {
		return content, nil
	}
	return nil, err
}

func processData(fileContents [][]string, output []json.RawMessage, matcher func([]string) bool) []json.RawMessage {
	for _, data := range fileContents {
		if matcher(data) {
			item := []byte(open + data[1] + seperator + data[2] + close)
			_, output = AddToUniqueSortedJSONSet(output, item)
		}
	}
	return output
}

func getVisitsAndCaptures() []byte {
	var fileContents [][]string
	var err error
	if fileContents, err = readFile(); err != nil {
		log.Println(err)
		return nil
	}

	capturedPortals := make([]json.RawMessage, 0)
	capturedPortals = processData(fileContents, capturedPortals, func(line []string) bool {
		return line[3] == "captured portal" && line[4] != "failed"
	})

	visitedPortals := make([]json.RawMessage, 0)
	visitedPortals = processData(fileContents, visitedPortals, func(line []string) bool {
		return ((strings.HasPrefix(line[3], "hacked") && strings.HasSuffix(line[3], "portal")) || strings.HasSuffix(line[3], "deployed")) && line[4] != "failed"
	})

	result := struct {
		Visits   []json.RawMessage `json:"visits"`
		Captures []json.RawMessage `json:"captures"`
	}{
		visitedPortals, capturedPortals,
	}

	var encodedJSON []byte
	if encodedJSON, err = json.Marshal(result); err != nil {
		log.Println(err)
		return nil
	}
	return encodedJSON
}
