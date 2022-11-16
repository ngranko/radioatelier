package property

import (
	"errors"

	"github.com/jomei/notionapi"
)

type TitleProperty struct {
	Property
	Value []notionapi.RichText
}

func NewTitleProperty() *TitleProperty {
	return &TitleProperty{
		Value: []notionapi.RichText{
			{
				Text: &notionapi.Text{
					Content: "",
				},
			},
		},
	}
}

func (p *TitleProperty) FillFromNotion(prop notionapi.Property) (Property, error) {
	if prop.GetType() != notionapi.PropertyTypeTitle {
		return nil, errors.New("Wrong notion property type")
	}
	p.Value = prop.(*notionapi.TitleProperty).Title
	return p, nil
}

func (p *TitleProperty) ToNotionProperty() notionapi.Property {
	return notionapi.TitleProperty{Title: p.Value}
}

func (p *TitleProperty) GetValue() string {
	if len(p.Value) == 0 {
		return ""
	}
	return p.Value[0].PlainText
}

func (p *TitleProperty) SetValue(value string) {
	p.Value[0] = notionapi.RichText{Text: &notionapi.Text{Content: value}}
}
