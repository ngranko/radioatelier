package model

type Migration struct {
	Base
	Version string `gorm:"type:char(12);unique;not null"`
}
