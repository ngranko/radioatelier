package property

import (
    "errors"

    "github.com/jomei/notionapi"
)

type RichTextProperty struct {
    Property
    Value []notionapi.RichText
}

func NewRichTextProperty() *RichTextProperty {
    return &RichTextProperty{
        Value: []notionapi.RichText{},
    }
}

func (p *RichTextProperty) FillFromNotion(prop notionapi.Property) (Property, error) {
    if prop.GetType() != notionapi.PropertyTypeRichText {
        return nil, errors.New("wrong notion property type")
    }
    p.Value = prop.(*notionapi.RichTextProperty).RichText
    return p, nil
}

func (p *RichTextProperty) ToNotionProperty() notionapi.Property {
    return notionapi.RichTextProperty{RichText: p.Value}
}

func (p *RichTextProperty) GetValue() *string {
    if len(p.Value) == 0 {
        return nil
    }
    return &p.Value[0].PlainText
}

func (p *RichTextProperty) SetValue(value *string) {
    if value == nil {
        p.Value = []notionapi.RichText{}
        return
    }

    p.Value[0] = notionapi.RichText{
        Text: &notionapi.Text{
            Content: *value,
        },
        PlainText: *value,
    }
}
