package model

type Image struct {
    Base
    Link        string `gorm:"not null"`
    PreviewLink string
}
