package model

type MapPoint struct {
    Base
    Latitude  string `gorm:"type:varchar(20)"`
    Longitude string `gorm:"type:varchar(20)"`
    Address   string `gorm:"type:varchar(128)"`
    City      string `gorm:"type:varchar(64)"`
    Country   string `gorm:"type:varchar(64)"`
}
