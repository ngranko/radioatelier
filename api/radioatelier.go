package main

import (
	"context"
	"errors"
	"log"
	"net/http"

	"entgo.io/contrib/entgql"
	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/playground"
	"github.com/go-sql-driver/mysql"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"

	"radioatelier/ent"
	"radioatelier/ent/migrate"
	"radioatelier/graph/resolver"
	"radioatelier/package/config"
)

func main() {
	e := echo.New()

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
	}
	client, err := ent.Open("mysql", mc.FormatDSN(), entOptions...)
	if err != nil {
		log.Fatalf("Error: mysql client: %v\n", err)
	}
	defer client.Close()
	// Run the migration here
	err = client.Schema.Create(
		context.Background(),
		migrate.WithDropIndex(true),
		migrate.WithDropColumn(true),
	)

	if !errors.Is(err, nil) {
		log.Fatalf("Error: failed creating schema resources %v\n", err)
	}

	e.Use(middleware.Logger())
	e.Use(middleware.Recover())

	srv := handler.NewDefaultServer(resolver.NewSchema(client))
	srv.Use(entgql.Transactioner{TxOpener: client})
	{
		e.POST("/query", func(c echo.Context) error {
			srv.ServeHTTP(c.Response(), c.Request())
			return nil
		})

		e.GET("/playground", func(c echo.Context) error {
			playground.Handler("GraphQL", "/query").ServeHTTP(c.Response(), c.Request())
			return nil
		})
	}

	e.GET("/", func(c echo.Context) error {
		return c.String(http.StatusOK, "Welcome!")
	})

	e.Logger.Fatal(e.Start(":8080"))
}
