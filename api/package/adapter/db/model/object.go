package model

import (
    "time"

    "github.com/google/uuid"
)

type Object struct {
    Base
    IsPublic        bool   `gorm:"type:tinyint(1);not null;default:0"`
    Name            string `gorm:"type:varchar(255);not null"`
    MapPointID      uuid.UUID
    MapPoint        MapPoint
    Description     string
    InstalledPeriod string `gorm:"type:varchar(20)"`
    IsRemoved       bool   `gorm:"type:tinyint(1);not null;default:0"`
    RemovalPeriod   string `gorm:"type:varchar(20)"`
    Source          string
    CategoryID      uuid.UUID
    Category        Category
    Tags            []*Tag        `gorm:"many2many:object_tags;constraint:OnDelete:CASCADE"`
    PrivateTags     []*PrivateTag `gorm:"many2many:object_private_tags;constraint:OnDelete:CASCADE"`
    Image           string        `gorm:"type:blob"`
    NotionID        *uuid.UUID    `gorm:"type:char(36)"`
    LastSync        *time.Time
    CreatedBy       uuid.UUID `gorm:"type:char(36);not null"`
    Creator         User      `gorm:"foreignKey:created_by"`
    UpdatedBy       uuid.UUID `gorm:"type:char(36);not null"`
    Updater         User      `gorm:"foreignKey:updated_by"`
    ObjectUser      []ObjectUser
}
