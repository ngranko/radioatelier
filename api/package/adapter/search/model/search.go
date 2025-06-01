package model

type ManticoreResults struct {
    Hits     Hits `json:"hits"`
    TimedOut bool `json:"timed_out"`
    Took     int  `json:"took"`
}

type Hits struct {
    Hits          []Hit  `json:"hits"`
    Total         int    `json:"total"`
    TotalRelation string `json:"total_relation"`
}

type Hit struct {
    Score  int    `json:"_score"`
    Source Source `json:"_source"`
}

type Source struct {
    Address      string  `json:"address"`
    City         string  `json:"city"`
    Country      string  `json:"country"`
    CategoryName string  `json:"category_name"`
    Distance     float64 `json:"distance"`
    Latitude     float64 `json:"latitude"`
    Longitude    float64 `json:"longitude"`
    Name         string  `json:"name"`
    ObjectID     string  `json:"object_id"`
    Weight       int     `json:"weight"`
}

type SearchResults struct {
    Items         []SearchItem `json:"items"`
    HasMore       bool         `json:"hasMore"`
    Offset        int          `json:"offset"`
    NextPageToken string       `json:"nextPageToken"`
}

type SearchItem struct {
    ID           *string        `json:"id"`
    Name         string         `json:"name"`
    CategoryName string         `json:"categoryName"`
    Latitude     string         `json:"lat"`
    Longitude    string         `json:"lng"`
    Address      string         `json:"address"`
    City         string         `json:"city"`
    Country      string         `json:"country"`
    Type         SearchItemType `json:"type"`
}

type SearchItemType string

const (
    SearchItemTypeLocal  SearchItemType = "local"
    SearchItemTypeGoogle                = "google"
)
