package search

import (
    "fmt"

    Manticoresearch "github.com/manticoresoftware/manticoresearch-go"

    "radioatelier/package/config"
)

type Client = Manticoresearch.APIClient

var c *Client

func init() {
    configuration := Manticoresearch.NewConfiguration()
    configuration.Servers[0].URL = fmt.Sprintf("%s:%d", config.Get().Manticore.Host, config.Get().Manticore.Port)
    c = Manticoresearch.NewAPIClient(configuration)
}

func Get() *Client {
    return c
}
