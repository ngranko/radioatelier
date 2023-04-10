package db

import (
	"context"
	"log"

	"entgo.io/ent/dialect/sql/schema"
	"github.com/go-sql-driver/mysql"

	"radioatelier/ent"
	"radioatelier/package/config"
	"radioatelier/package/infrastructure/db/hook"
)

var c *ent.Client

func init() {
	var entOptions []ent.Option
	// TODO: remove the Degug() when testing is done
	entOptions = append(entOptions, ent.Debug())

	client, err := ent.Open("mysql", getDSN(), entOptions...)
	if err != nil {
		log.Fatalf("Error: mysql client: %v", err)
	}

	err = client.Schema.Create(
		context.Background(),
		schema.WithHooks(hook.SetSchemaCollation),
	)
	if err != nil {
		log.Fatalf("Error: mysql client: %v", err)
	}

	//client.Object.Use(hook.SyncWithNotion)

	c = client
}

func getDSN() string {
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
			"charset":   "utf8mb4",
			"collation": "utf8mb4_0900_ai_ci",
		},
	}

	return mc.FormatDSN()
}

func Client() *ent.Client {
	return c
}
