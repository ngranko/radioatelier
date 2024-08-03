package model

type Tag struct {
    Base
    Name    string    `gorm:"type:varchar(100);not null"`
    Objects []*Object `gorm:"many2many:object_tags;constraint:OnDelete:CASCADE"`
}
