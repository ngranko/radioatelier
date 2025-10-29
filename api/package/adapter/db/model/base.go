package model

import (
    "time"

    "gorm.io/gorm"

    "radioatelier/package/infrastructure/ulid"
)

type Base struct {
    ID        ulid.ULID `gorm:"type:binary(16);primaryKey"`
    CreatedAt time.Time `gorm:"autoCreateTime"`
    UpdatedAt time.Time `gorm:"autoUpdateTime"`
}

// BeforeCreate is called before creating Base
func (base *Base) BeforeCreate(tx *gorm.DB) error {
    if base.ID == (ulid.ULID{}) {
        base.ID = ulid.NewULID()
    }
    return nil
}
