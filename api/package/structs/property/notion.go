package property

import (
	"strings"
	"time"

	"github.com/jomei/notionapi"
)

type TitleProperty struct {
	property *notionapi.TitleProperty
}

func NewTitleProperty(prop notionapi.Property) TitleProperty {
	return TitleProperty{
		property: prop.(*notionapi.TitleProperty),
	}
}

func (p TitleProperty) GetValue() string {
	if len(p.property.Title) == 0 {
		return ""
	}
	return p.property.Title[0].PlainText
}

type RichTextProperty struct {
	property *notionapi.RichTextProperty
}

func NewRichTextProperty(prop notionapi.Property) RichTextProperty {
	return RichTextProperty{
		property: prop.(*notionapi.RichTextProperty),
	}
}

func (p RichTextProperty) GetValue() string {
	if len(p.property.RichText) == 0 {
		return ""
	}
	return p.property.RichText[0].PlainText
}

func (p RichTextProperty) GetNillableValue() *string {
	if len(p.property.RichText) > 0 {
		val := p.GetValue()
		return &val
	}
	return nil
}

type CheckboxProperty struct {
	property *notionapi.CheckboxProperty
}

func NewCheckboxProperty(prop notionapi.Property) CheckboxProperty {
	return CheckboxProperty{
		property: prop.(*notionapi.CheckboxProperty),
	}
}

func (p CheckboxProperty) GetValue() bool {
	return p.property.Checkbox
}

type URLProperty struct {
	property *notionapi.URLProperty
}

func NewURLProperty(prop notionapi.Property) URLProperty {
	return URLProperty{
		property: prop.(*notionapi.URLProperty),
	}
}

func (p URLProperty) GetValue() string {
	return p.property.URL
}

type SelectProperty struct {
	property *notionapi.SelectProperty
}

func NewSelectProperty(prop notionapi.Property) SelectProperty {
	return SelectProperty{
		property: prop.(*notionapi.SelectProperty),
	}
}

func (p SelectProperty) GetValue() string {
	return p.property.Select.Name
}

type MultiSelectProperty struct {
	property *notionapi.MultiSelectProperty
}

func NewMultiSelectProperty(prop notionapi.Property) MultiSelectProperty {
	return MultiSelectProperty{
		property: prop.(*notionapi.MultiSelectProperty),
	}
}

func (p MultiSelectProperty) GetValue() string {
	list := make([]string, 0)

	for _, value := range p.property.MultiSelect {
		list = append(list, value.Name)
	}
	return strings.Join(list, ", ")
}

type DateProperty struct {
	property *notionapi.DateProperty
}

func NewDateProperty(prop notionapi.Property) DateProperty {
	return DateProperty{
		property: prop.(*notionapi.DateProperty),
	}
}

func (p DateProperty) GetValue() time.Time {
	return time.Time(*p.property.Date.Start)
}

func (p DateProperty) GetNillableValue() *time.Time {
	if p.property.Date != nil && p.property.Date.Start != nil {
		notionDate := time.Time(*p.property.Date.Start)
		return &notionDate
	}
	return nil
}
