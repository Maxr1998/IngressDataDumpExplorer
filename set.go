package main

import (
	"encoding/json"
	"sort"
)

// AddToUniqueSortedJSONSet add element to the set (which must be sorted) at the right position
func AddToUniqueSortedJSONSet(set []json.RawMessage, element json.RawMessage) (bool, []json.RawMessage) {
	i := sort.Search(len(set), func(j int) bool { return string(set[j]) >= string(element) })
	if i < len(set) && string(set[i]) == string(element) {
		return false, set
	}
	set = append(set, []byte("_"))
	if i < len(set)-1 {
		copy(set[i+1:], set[i:])
	}
	set[i] = element
	return true, set
}
