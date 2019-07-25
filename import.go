package main

import (
	"encoding/csv"
	"encoding/json"
	"log"
	"os"
	"strings"
)

const jsonOpenTag = "["
const jsonCloseTag = "]"
const jsonSeparator = ","

func readFile(fileName string, separator rune) ([][]string, error) {
	var err error
	file, err := os.Open(fileName)
	if err != nil {
		return nil, err
	}

	//sed -i 's/None\tNone$/None/g' game_log.tsv

	// Initialize our csv reader
	csvReader := csv.NewReader(file)
	csvReader.Comma = separator
	csvReader.LazyQuotes = true

	// Read the data
	if content, err := csvReader.ReadAll(); err == nil {
		return content, nil
	}
	return nil, err
}

func processData(fileContents [][]string, output []json.RawMessage, matcher func([]string) bool) []json.RawMessage {
	for _, line := range fileContents {
		if matcher(line) {
			item := []byte(jsonOpenTag + line[1] + jsonSeparator + line[2] + jsonCloseTag)
			_, output = AddToUniqueSortedJSONSet(output, item)
		}
	}
	return output
}

func getVisitsAndCaptures() []byte {
	var fileContents [][]string
	var err error

	portals := make([]json.RawMessage, 0)
	if fileContents, err = readFile("dump/Portal_Export.csv", ','); err != nil {
		log.Println("Did not find scraped portal list, ignoring…")
	} else {
		portals = processData(fileContents, portals, func(line []string) bool {
			return true
		})
	}

	if fileContents, err = readFile("dump/game_log.tsv", '\t'); err != nil {
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
		Portals  []json.RawMessage `json:"portals"`
		Visits   []json.RawMessage `json:"visits"`
		Captures []json.RawMessage `json:"captures"`
	}{
		portals, visitedPortals, capturedPortals,
	}

	var encodedJSON []byte
	if encodedJSON, err = json.Marshal(result); err != nil {
		log.Println(err)
		return nil
	}
	return encodedJSON
}
