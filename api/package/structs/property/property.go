package property

import (
	"github.com/jomei/notionapi"
)

type Property interface {
	FillFromNotion(prop notionapi.Property) (Property, error)
	ToNotionProperty() notionapi.Property
}
