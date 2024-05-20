package property

import (
    "time"

    "github.com/jomei/notionapi"
)

type Property interface {
    Raw() notionapi.Property
}

type CheckboxProperty struct {
    Name  string
    Value *bool
}

func (p *CheckboxProperty) Raw() notionapi.Property {
    if p.Value == nil {
        return nil
    }

    return notionapi.CheckboxProperty{
        Checkbox: *p.Value,
    }
}

type DateProperty struct {
    Name  string
    Value *time.Time
}

func (p *DateProperty) Raw() notionapi.Property {
    if p.Value == nil {
        return nil
    }

    return notionapi.DateProperty{
        Date: &notionapi.DateObject{
            Start: (*notionapi.Date)(p.Value),
        },
    }
}

type MultiSelectProperty struct {
    Name  string
    Value *[]string
}

func (p *MultiSelectProperty) Raw() notionapi.Property {
    if p.Value == nil {
        return nil
    }

    var optionArr []notionapi.Option
    for _, tag := range *p.Value {
        optionArr = append(optionArr, notionapi.Option{
            Name: tag,
        })
    }

    return notionapi.MultiSelectProperty{
        MultiSelect: optionArr,
    }
}

type RichTextProperty struct {
    Name  string
    Value *string
}

func (p *RichTextProperty) Raw() notionapi.Property {
    if p.Value == nil {
        return nil
    }

    return notionapi.RichTextProperty{
        RichText: []notionapi.RichText{
            {
                Text: &notionapi.Text{
                    Content: *p.Value,
                },
                PlainText: *p.Value,
            },
        },
    }
}

type SelectProperty struct {
    Name  string
    Value *string
}

func (p *SelectProperty) Raw() notionapi.Property {
    if p.Value == nil {
        return nil
    }

    return notionapi.SelectProperty{
        Select: notionapi.Option{
            Name: *p.Value,
        },
    }
}

type TitleProperty struct {
    Name  string
    Value *string
}

func (p *TitleProperty) Raw() notionapi.Property {
    if p.Value == nil {
        return nil
    }

    return notionapi.TitleProperty{
        Title: []notionapi.RichText{
            {
                Text: &notionapi.Text{
                    Content: *p.Value,
                },
            },
        },
    }
}

type URLProperty struct {
    Name  string
    Value *string
}

func (p *URLProperty) Raw() notionapi.Property {
    if p.Value == nil {
        return nil
    }

    return notionapi.URLProperty{URL: *p.Value}
}
