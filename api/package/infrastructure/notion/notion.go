package notion

import (
	"radioatelier/package/config"

	"github.com/jomei/notionapi"
)

var сlient *notionapi.Client

func init() {
	conf := config.Get()

	сlient = notionapi.NewClient(notionapi.Token(conf.NotionToken))
}

func Client() *notionapi.Client {
	return сlient
}
