package external

import (
	"radioatelier/package/config"

	"github.com/jomei/notionapi"
)

var NotionClient *notionapi.Client

func init() {
	conf := config.Get()

	NotionClient = notionapi.NewClient(notionapi.Token(conf.NotionToken))
}
