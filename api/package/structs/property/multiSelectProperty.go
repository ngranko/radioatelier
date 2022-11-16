package property

import (
    "errors"
    "strings"

    "github.com/jomei/notionapi"
)

type MultiSelectProperty struct {
    Property
    Value []notionapi.Option
}

func NewMultiSelectProperty() *MultiSelectProperty {
    return &MultiSelectProperty{
        Value: []notionapi.Option{
            {
                Name: "",
            },
        },
    }
}

func (p *MultiSelectProperty) FillFromNotion(prop notionapi.Property) (Property, error) {
    if prop.GetType() != notionapi.PropertyTypeMultiSelect {
        return nil, errors.New("wrong notion property type")
    }
    p.Value = prop.(*notionapi.MultiSelectProperty).MultiSelect
    return p, nil
}

func (p *MultiSelectProperty) ToNotionProperty() notionapi.Property {
    return notionapi.MultiSelectProperty{MultiSelect: p.Value}
}

func (p *MultiSelectProperty) GetValue() string {
    list := make([]string, 0)
    for _, value := range p.Value {
        list = append(list, value.Name)
    }
    return strings.Join(list, ", ")
}

func (p *MultiSelectProperty) SetValue(value string) {
    tagArr := strings.Split(value, ", ")
    optionArr := []notionapi.Option{}
    for _, tag := range tagArr {
        optionArr = append(optionArr, notionapi.Option{
            Name: tag,
        })
    }
    p.Value = optionArr
}
