package db

import (
    "fmt"

    "gorm.io/driver/mysql"
    "gorm.io/gorm"

    "radioatelier/package/config"
)

type Client = gorm.DB

var c *Client

func init() {
    conf := config.Get()
    dsn := fmt.Sprintf(
        "%s:%s@tcp(%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
        conf.MySQL.User,
        conf.MySQL.Pass,
        conf.MySQL.Host,
        conf.MySQL.Name,
    )

    db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
    if err != nil {
        panic(err)
    }

    c = db
}

func Get() *Client {
    return c
}
