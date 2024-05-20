package model

type Category struct {
    Base
    Name string `gorm:"type:varchar(100);not null"`
}
