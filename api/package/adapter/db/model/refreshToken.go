package model

import (
    "time"

    "radioatelier/package/infrastructure/ulid"
)

type RefreshToken struct {
    Base
    Token      string    `gorm:"type:char(128);not null;uniqueIndex"`
    Family     string    `gorm:"type:char(128);not null;index"`
    UserID     ulid.ULID `gorm:"type:binary(16);not null"`
    User       User      `gorm:"not null;constraint:OnDelete:CASCADE"`
    IsUsed     bool      `gorm:"not null;default:0"`
    ValidUntil time.Time `gorm:"not null"`
}
