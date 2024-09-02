package notion

import (
    "radioatelier/package/config"

    "github.com/jomei/notionapi"
)

type Client = notionapi.Client

var client *Client

func init() {
    conf := config.Get()

    client = notionapi.NewClient(notionapi.Token(conf.Notion.Token))
}

func GetClient() *Client {
    return client
}
