package property

import (
	"errors"

	"github.com/jomei/notionapi"
)

type CheckboxProperty struct {
	Property
	Value bool
}

func NewCheckboxProperty() *CheckboxProperty {
	return &CheckboxProperty{
		Value: false,
	}
}

func (p *CheckboxProperty) FillFromNotion(prop notionapi.Property) (Property, error) {
	if prop.GetType() != notionapi.PropertyTypeCheckbox {
		return nil, errors.New("Wrong notion property type")
	}
	p.Value = prop.(notionapi.CheckboxProperty).Checkbox
	return p, nil
}

func (p *CheckboxProperty) ToNotionProperty() notionapi.Property {
	return notionapi.CheckboxProperty{Checkbox: p.Value}
}

func (p *CheckboxProperty) GetValue() bool {
	return bool(p.Value)
}

func (p *CheckboxProperty) SetValue(value bool) {
	p.Value = value
}
