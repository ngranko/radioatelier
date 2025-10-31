package model

import (
    "time"

    "github.com/google/uuid"

    "radioatelier/package/infrastructure/ulid"
)

type Object struct {
    Base
    IsPublic        bool      `gorm:"type:tinyint(1);not null;default:0"`
    Name            string    `gorm:"type:varchar(255);not null"`
    MapPointID      ulid.ULID `gorm:"type:binary(16);not null"`
    MapPoint        MapPoint
    Description     string
    InstalledPeriod string `gorm:"type:varchar(20)"`
    IsRemoved       bool   `gorm:"type:tinyint(1);not null;default:0"`
    RemovalPeriod   string `gorm:"type:varchar(20)"`
    Source          string
    CategoryID      ulid.ULID `gorm:"type:binary(16);not null"`
    Category        Category
    Tags            []*Tag        `gorm:"many2many:object_tags;constraint:OnDelete:CASCADE"`
    PrivateTags     []*PrivateTag `gorm:"many2many:object_private_tags;constraint:OnDelete:CASCADE"`
    Image           string        `gorm:"type:blob"`
    NotionID        *uuid.UUID    `gorm:"type:char(36)"`
    LastSync        *time.Time
    InternalID      string       `gorm:"->;type:varchar(16)"`
    CreatedBy       ulid.ULID    `gorm:"type:binary(16);not null"`
    Creator         User         `gorm:"foreignKey:created_by"`
    ObjectUser      []ObjectUser `gorm:"constraint:OnDelete:CASCADE"`
}
