package property

import (
	"errors"

	"github.com/jomei/notionapi"
)

type SelectProperty struct {
	Property
	Value notionapi.Option
}

func NewSelectProperty() *SelectProperty {
	return &SelectProperty{
		Value: notionapi.Option{
			Name: "",
		},
	}
}

func (p *SelectProperty) FillFromNotion(prop notionapi.Property) (Property, error) {
	if prop.GetType() != notionapi.PropertyTypeSelect {
		return nil, errors.New("Wrong notion property type")
	}
	p.Value = prop.(notionapi.SelectProperty).Select
	return p, nil
}

func (p *SelectProperty) ToNotionProperty() notionapi.Property {
	return notionapi.SelectProperty{Select: p.Value}
}

func (p *SelectProperty) GetValue() string {
	return p.Value.Name
}

func (p *SelectProperty) SetValue(value string) {
	p.Value = notionapi.Option{
		Name: value,
	}
}
