package db

import (
    "log"
    "radioatelier/ent"
    "radioatelier/package/config"

    "github.com/go-sql-driver/mysql"
)

var Client *ent.Client

func init() {
    var entOptions []ent.Option
    entOptions = append(entOptions, ent.Debug())

    conf := config.Get()

    mc := mysql.Config{
        User:                 conf.DBUser,
        Passwd:               conf.DBPass,
        Net:                  "tcp",
        Addr:                 conf.DBHost,
        DBName:               conf.DBName,
        AllowNativePasswords: true,
        ParseTime:            true,
        Params: map[string]string{
            "charset": "utf8mb4",
        },
    }
    client, err := ent.Open("mysql", mc.FormatDSN(), entOptions...)
    if err != nil {
        log.Fatalf("Error: mysql client: %v\n", err)
    }

    Client = client
}
