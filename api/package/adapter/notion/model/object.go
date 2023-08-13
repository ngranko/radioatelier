package model

import (
    "time"

    "github.com/jomei/notionapi"
)

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

type Object struct {
    Name            string
    Address         *string
    InstalledPeriod *string
    IsRemoved       bool
    RemovedPeriod   *string
    Source          string
    Type            string
    Tags            string
    CreatedAt       time.Time
    UpdatedAt       time.Time
    DeletedAt       *time.Time
    CreatedBy       string  // ???
    UpdatedBy       string  // ???
    DeletedBy       *string // ???
    NotionID        string
    City            string
    Country         string
    LastSync        *time.Time
}

func NewObject() Object {
    return Object{}
}

func NewObjectFromRaw(page notionapi.Page) Object {
    var address *string
    var installedPeriod *string
    var removedPeriod *string

    if len(page.Properties[string(Address)].(*notionapi.RichTextProperty).RichText) > 0 {
        address = &page.Properties[string(Address)].(*notionapi.RichTextProperty).RichText[0].PlainText
    } else {
        address = nil
    }

    if len(page.Properties[string(InstalledPeriod)].(*notionapi.RichTextProperty).RichText) > 0 {
        installedPeriod = &page.Properties[string(InstalledPeriod)].(*notionapi.RichTextProperty).RichText[0].PlainText
    } else {
        installedPeriod = nil
    }

    if len(page.Properties[string(RemovedPeriod)].(*notionapi.RichTextProperty).RichText) > 0 {
        removedPeriod = &page.Properties[string(RemovedPeriod)].(*notionapi.RichTextProperty).RichText[0].PlainText
    } else {
        removedPeriod = nil
    }

    result := Object{
        Name:            page.Properties[string(Name)].(*notionapi.TitleProperty).Title[0].PlainText,
        Address:         address,
        InstalledPeriod: installedPeriod,
        IsRemoved:       page.Properties[string(IsRemoved)].(*notionapi.CheckboxProperty).Checkbox,
        RemovedPeriod:   removedPeriod,
        Source:          page.Properties[string(Source)].(*notionapi.URLProperty).URL,
        Type:            page.Properties[string(Type)].(*notionapi.SelectProperty).Select.Name,
        CreatedAt:       page.CreatedTime,
        UpdatedAt:       page.LastEditedTime,
        CreatedBy:       string(page.CreatedBy.ID),
        UpdatedBy:       string(page.LastEditedBy.ID),
        NotionID:        string(page.ID),
        City:            page.Properties[string(City)].(*notionapi.SelectProperty).Select.Name,
        Country:         page.Properties[string(Country)].(*notionapi.SelectProperty).Select.Name,
        LastSync:        (*time.Time)(page.Properties[string(LastSync)].(*notionapi.DateProperty).Date.Start),
    }

    if page.Archived {
        result.DeletedAt = &result.UpdatedAt
        result.DeletedBy = &result.UpdatedBy
    }

    return result
}
