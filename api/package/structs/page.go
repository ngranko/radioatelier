package structs

import (
    "time"

    "github.com/jomei/notionapi"
)

type Page struct {
    Name            string
    Address         string
    IsVisited       bool
    LastVisited     *time.Time
    InstalledPeriod *string
    IsRemoved       bool
    RemovedPeriod   *string
    Source          string
    Type            string
    Tags            string
    CreatedAt       time.Time
    UpdatedAt       time.Time
    DeletedAt       *time.Time
    CreatedBy       string
    UpdatedBy       string
    DeletedBy       *string
    NotionID        string
    City            string
    Country         string
}

func NewPageFromNotion(page notionapi.Page) Page {
    props := NewPageProperties().FillFromNotion(page.Properties)
    result := Page{
        Name:            props.GetName(),
        IsVisited:       props.GetIsVisited(),
        LastVisited:     props.GetLastVisited(),
        InstalledPeriod: props.GetInstalledPeriod(),
        IsRemoved:       props.GetIsRemoved(),
        RemovedPeriod:   props.GetRemovedPeriod(),
        Source:          props.GetSource(),
        Type:            props.GetType(),
        Tags:            props.GetTags(),
        CreatedAt:       page.CreatedTime,
        UpdatedAt:       page.LastEditedTime,
        CreatedBy:       string(page.CreatedBy.ID),
        UpdatedBy:       string(page.LastEditedBy.ID),
        NotionID:        string(page.ID),
        City:            props.GetCity(),
        Country:         props.GetCountry(),
    }

    if page.Archived {
        result.DeletedAt = &result.UpdatedAt
        result.DeletedBy = &result.UpdatedBy
    }

    return result
}
