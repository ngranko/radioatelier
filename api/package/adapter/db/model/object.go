package model

import (
    "time"

    "github.com/google/uuid"
)

type Object struct {
    Base
    Name            string `gorm:"type:varchar(255);not null"`
    Address         string `gorm:"type:varchar(128)"`
    CityID          *uuid.UUID
    City            *City
    Description     string
    Latitude        string `gorm:"type:varchar(20)"`
    Longitude       string `gorm:"type:varchar(20)"`
    InstalledPeriod string `gorm:"type:varchar(20)"`
    IsRemoved       bool   `gorm:"type:tinyint(1);not null;default:0"`
    RemovalPeriod   string `gorm:"type:varchar(20)"`
    Source          string
    CategoryID      uuid.UUID
    Category        Category
    Tags            string     `gorm:"type:varchar(100)"`
    Image           string     `gorm:"type:blob"`
    NotionID        *uuid.UUID `gorm:"type:char(36)"`
    LastSync        *time.Time
    CreatedBy       uuid.UUID `gorm:"type:char(36);not null"`
    Creator         User      `gorm:"foreignKey:created_by"`
    UpdatedBy       uuid.UUID `gorm:"type:char(36);not null"`
    Updater         User      `gorm:"foreignKey:updated_by"`
}
