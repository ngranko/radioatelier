package property

import (
    "errors"

    "github.com/jomei/notionapi"
)

type URLProperty struct {
    Property
    Value string
}

func NewURLProperty() *URLProperty {
    return &URLProperty{
        Value: "",
    }
}

func (p *URLProperty) FillFromNotion(prop notionapi.Property) (Property, error) {
    if prop.GetType() != notionapi.PropertyTypeURL {
        return nil, errors.New("wrong notion property type")
    }
    p.Value = prop.(*notionapi.URLProperty).URL
    return p, nil
}

func (p *URLProperty) ToNotionProperty() notionapi.Property {
    if p.Value == "" {
        return nil
    }
    return notionapi.URLProperty{URL: p.Value}
}

func (p *URLProperty) GetValue() string {
    return p.Value
}

func (p *URLProperty) SetValue(value string) {
    p.Value = value
}
