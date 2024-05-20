package model

import (
	"time"

	"github.com/google/uuid"
)

type RefreshToken struct {
	Base
	Token      string `gorm:"type:char(128);not null;uniqueIndex"`
	Family     string `gorm:"type:char(128);not null;index"`
	UserID     uuid.UUID
	User       User      `gorm:"not null;constraint:OnDelete:CASCADE"`
	IsUsed     bool      `gorm:"not null;default:0"`
	ValidUntil time.Time `gorm:"not null"`
}
