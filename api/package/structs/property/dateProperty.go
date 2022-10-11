package property

import (
	"errors"
	"time"

	"github.com/jomei/notionapi"
)

type DateProperty struct {
	Property
	Value *notionapi.DateObject
}

func NewDateProperty() *DateProperty {
	return &DateProperty{
		Value: &notionapi.DateObject{
			Start: nil,
		},
	}
}

func (p *DateProperty) FillFromNotion(prop notionapi.Property) (Property, error) {
	if prop.GetType() != notionapi.PropertyTypeDate {
		return nil, errors.New("Wrong notion property type")
	}
	p.Value = prop.(notionapi.DateProperty).Date
	return p, nil
}

func (p *DateProperty) ToNotionProperty() notionapi.Property {
	return notionapi.DateProperty{Date: p.Value}
}

func (p *DateProperty) GetValue() *time.Time {
	if p.Value == nil || p.Value.Start == nil {
		return nil
	}
	time := time.Time(*p.Value.Start)
	return &time
}

func (p *DateProperty) SetValue(value *time.Time) {
	p.Value.Start = (*notionapi.Date)(value)
}
