package model

type City struct {
    Base
    Name    string `gorm:"type:varchar(50);not null"`
    Country string `gorm:"type:varchar(50);not null"`
}
