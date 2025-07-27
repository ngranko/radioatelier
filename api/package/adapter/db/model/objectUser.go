package model

import (
    "github.com/google/uuid"
)

type ObjectUser struct {
    Base
    IsVisited bool      `gorm:"type:tinyint(1);not null;default:0"`
    UserID    uuid.UUID `gorm:"type:char(36);not null"`
    User      User      `gorm:"constraint:OnDelete:CASCADE"`
    ObjectID  uuid.UUID `gorm:"type:char(36);not null"`
    Object    Object    `gorm:"constraint:OnDelete:CASCADE"`
}
