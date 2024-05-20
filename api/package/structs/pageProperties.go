package structs

import (
    "context"
    "fmt"
    "time"

    "radioatelier/package/adapter/db/model"
    "radioatelier/package/structs/property"

    "github.com/jomei/notionapi"
)

type PageProperties map[PropertyName]property.Property

type PropertyName string

const (
    Name            PropertyName = "Название"
    Address         PropertyName = "Адрес"
    InstalledPeriod PropertyName = "Период установки"
    IsRemoved       PropertyName = "Демонтирован"
    RemovedPeriod   PropertyName = "Период демонтажа"
    Source          PropertyName = "Источник"
    Type            PropertyName = "Тип"
    Tags            PropertyName = "Теги"
    City            PropertyName = "Город"
    Country         PropertyName = "Страна"
    LastSync        PropertyName = "Последняя синхронизация"
)

func NewPageProperties() PageProperties {
    return PageProperties{
        Name:            property.NewTitleProperty(),
        Address:         property.NewRichTextProperty(),
        InstalledPeriod: property.NewRichTextProperty(),
        IsRemoved:       property.NewCheckboxProperty(),
        RemovedPeriod:   property.NewRichTextProperty(),
        Source:          property.NewURLProperty(),
        Type:            property.NewSelectProperty(),
        Tags:            property.NewMultiSelectProperty(),
        City:            property.NewSelectProperty(),
        Country:         property.NewSelectProperty(),
        LastSync:        property.NewDateProperty(),
    }
}

func (p PageProperties) FillFromObject(ctx context.Context, obj *model.Object) PageProperties {
    p.SetName(obj.Name)
    p.SetAddress(obj.Address)
    p.SetIsRemoved(obj.IsRemoved)
    p.SetType(obj.Category.Name)
    p.SetTags(obj.Tags)
    p.setLastSync(obj.LastSync)

    if obj.InstalledPeriod != nil {
        p.SetInstalledPeriod(obj.InstalledPeriod)
    }

    if obj.RemovalPeriod != nil {
        p.SetRemovedPeriod(obj.RemovalPeriod)
    }

    if obj.Source != nil {
        p.SetSource(*obj.Source)
    }

    city, err := obj.City(ctx)
    if err == nil {
        p.SetCity(city.Name)
        p.SetCountry(city.Country)
    }

    return p
}

func (p PageProperties) FillFromNotion(props notionapi.Properties) PageProperties {
    for propertyName := range p {
        if _, ok := props[string(propertyName)]; !ok {
            fmt.Println(fmt.Sprintf("Property %s is not set", propertyName))
            continue
        }
        _, err := p[propertyName].FillFromNotion(props[string(propertyName)])
        if err != nil {
            fmt.Println(err.Error())
        }
    }

    return p
}

func (p PageProperties) ToNotionProperties() notionapi.Properties {
    result := notionapi.Properties{}

    for name, value := range p {
        notionProp := value.ToNotionProperty()
        if notionProp == nil {
            continue
        }

        result[string(name)] = notionProp
    }

    return result
}

func (p PageProperties) isSet(name PropertyName) bool {
    _, ok := p[name]
    return ok
}

func (p PageProperties) GetName() string {
    return p[Name].(*property.TitleProperty).GetValue()
}

func (p PageProperties) SetName(value string) {
    p[Name].(*property.TitleProperty).SetValue(value)
}

func (p PageProperties) GetAddress() *string {
    return p[Address].(*property.RichTextProperty).GetValue()
}

func (p PageProperties) SetAddress(value *string) {
    p[Address].(*property.RichTextProperty).SetValue(value)
}

func (p PageProperties) GetInstalledPeriod() *string {
    return p[InstalledPeriod].(*property.RichTextProperty).GetValue()
}

func (p PageProperties) SetInstalledPeriod(value *string) {
    p[InstalledPeriod].(*property.RichTextProperty).SetValue(value)
}

func (p PageProperties) GetIsRemoved() bool {
    return p[IsRemoved].(*property.CheckboxProperty).GetValue()
}

func (p PageProperties) SetIsRemoved(value bool) {
    p[IsRemoved].(*property.CheckboxProperty).SetValue(value)
}

func (p PageProperties) GetRemovedPeriod() *string {
    return p[RemovedPeriod].(*property.RichTextProperty).GetValue()
}

func (p PageProperties) SetRemovedPeriod(value *string) {
    p[RemovedPeriod].(*property.RichTextProperty).SetValue(value)
}

func (p PageProperties) GetSource() string {
    return p[Source].(*property.URLProperty).GetValue()
}

func (p PageProperties) SetSource(value string) {
    p[Source].(*property.URLProperty).SetValue(value)
}

func (p PageProperties) GetType() string {
    return p[Type].(*property.SelectProperty).GetValue()
}

func (p PageProperties) SetType(value string) {
    p[Type].(*property.SelectProperty).SetValue(value)
}

func (p PageProperties) GetTags() string {
    return p[Tags].(*property.MultiSelectProperty).GetValue()
}

func (p PageProperties) SetTags(value string) {
    p[Tags].(*property.MultiSelectProperty).SetValue(value)
}

func (p PageProperties) GetCity() string {
    return p[City].(*property.SelectProperty).GetValue()
}

func (p PageProperties) SetCity(value string) {
    p[City].(*property.SelectProperty).SetValue(value)
}

func (p PageProperties) GetCountry() string {
    return p[Country].(*property.SelectProperty).GetValue()
}

func (p PageProperties) SetCountry(value string) {
    p[Country].(*property.SelectProperty).SetValue(value)
}

func (p PageProperties) setLastSync(value *time.Time) {
    p[LastSync].(*property.DateProperty).SetValue(value)
}
