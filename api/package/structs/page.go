package structs

import (
	"radioatelier/package/structs/property"
	"time"

	"github.com/jomei/notionapi"
)

type Page struct {
	Name            string
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
	result := Page{
		Name:            property.NewTitleProperty(page.Properties["Название"]).GetValue(),
		IsVisited:       property.NewCheckboxProperty(page.Properties["Посещен"]).GetValue(),
		LastVisited:     property.NewDateProperty(page.Properties["Последнее посещение"]).GetNillableValue(),
		InstalledPeriod: property.NewRichTextProperty(page.Properties["Период установки"]).GetNillableValue(),
		IsRemoved:       property.NewCheckboxProperty(page.Properties["Демонтирован"]).GetValue(),
		RemovedPeriod:   property.NewRichTextProperty(page.Properties["Период демонтажа"]).GetNillableValue(),
		Source:          property.NewURLProperty(page.Properties["Источник"]).GetValue(),
		Type:            property.NewSelectProperty(page.Properties["Тип"]).GetValue(),
		Tags:            property.NewMultiSelectProperty(page.Properties["Теги"]).GetValue(),
		CreatedAt:       page.CreatedTime,
		UpdatedAt:       page.LastEditedTime,
		CreatedBy:       string(page.CreatedBy.ID),
		UpdatedBy:       string(page.LastEditedBy.ID),
		NotionID:        string(page.ID),
		City:            property.NewSelectProperty(page.Properties["Город"]).GetValue(),
		Country:         property.NewSelectProperty(page.Properties["Страна"]).GetValue(),
	}

	if page.Archived {
		result.DeletedAt = &result.UpdatedAt
		result.DeletedBy = &result.UpdatedBy
	}

	return result
}
