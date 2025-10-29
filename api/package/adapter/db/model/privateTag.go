package model

import (
    "radioatelier/package/infrastructure/ulid"
)

type PrivateTag struct {
    Base
    Name      string    `gorm:"type:varchar(100);not null;uniqueIndex:created_by_name"`
    Objects   []*Object `gorm:"many2many:object_private_tags;constraint:OnDelete:CASCADE"`
    CreatedBy ulid.ULID `gorm:"type:binary(16);not null;uniqueIndex:created_by_name;index"`
    Creator   User      `gorm:"foreignKey:created_by"`
}
