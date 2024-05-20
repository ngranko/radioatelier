package model

import (
    "time"

    "github.com/google/uuid"
    "gorm.io/gorm"
)

type Base struct {
    ID        uuid.UUID `gorm:"type:char(36);primaryKey"`
    CreatedAt time.Time `gorm:"autoCreateTime"`
    UpdatedAt time.Time `gorm:"autoUpdateTime"`
}

// BeforeCreate is called before creating Base
func (base *Base) BeforeCreate(tx *gorm.DB) error {
    if base.ID == uuid.Nil {
        base.ID = uuid.New()
    }
    return nil
}
