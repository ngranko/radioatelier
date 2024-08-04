package model

import (
    "github.com/google/uuid"
)

type PrivateTag struct {
    Base
    Name      string    `gorm:"type:varchar(100);not null;uniqueIndex:created_by_name"`
    Objects   []*Object `gorm:"many2many:object_private_tags;constraint:OnDelete:CASCADE"`
    CreatedBy uuid.UUID `gorm:"type:char(36);not null;uniqueIndex:created_by_name;index"`
    Creator   User      `gorm:"foreignKey:created_by"`
}
