package model

import (
    "radioatelier/package/infrastructure/ulid"
)

type ObjectUser struct {
    Base
    IsVisited bool      `gorm:"type:tinyint(1);not null;default:0"`
    UserID    ulid.ULID `gorm:"type:binary(16);not null"`
    User      User      `gorm:"constraint:OnDelete:CASCADE"`
    ObjectID  ulid.ULID `gorm:"type:binary(16);not null"`
    Object    Object    `gorm:"constraint:OnDelete:CASCADE"`
}
