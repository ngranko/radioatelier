package model

import (
    "time"

    "github.com/google/uuid"
)

type User struct {
    Base
    Name      string `gorm:"type:varchar(50);not null"`
    Email     string `gorm:"type:varchar(50);not null;uniqueIndex"`
    Login     string `gorm:"type:varchar(24);not null;uniqueIndex"`
    Password  string `gorm:"type:char(60);not null)"`
    Role      string `gorm:"type:varchar(10);not null"`
    LastLogin *time.Time
    IsActive  bool       `gorm:"type:tinyint(1);not null;default:1"`
    NotionID  *uuid.UUID `gorm:"type:char(36)"`
}
