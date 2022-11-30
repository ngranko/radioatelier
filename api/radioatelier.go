package main

import (
    "context"
    "errors"
    "log"
    "net/http"

    "entgo.io/contrib/entgql"
    "github.com/99designs/gqlgen/graphql/handler"
    "github.com/99designs/gqlgen/graphql/playground"
    "github.com/labstack/echo/v4"
    "github.com/labstack/echo/v4/middleware"

    "radioatelier/ent/migrate"
    "radioatelier/graph/resolver"
    "radioatelier/package/db"
    _ "radioatelier/package/schedule"
)

func main() {
    e := echo.New()

    defer db.Client.Close()

    // Run the migration here
    err := db.Client.Schema.Create(
        context.Background(),
        migrate.WithDropIndex(true),
        migrate.WithDropColumn(true),
    )

    if !errors.Is(err, nil) {
        log.Fatalf("Error: failed creating schema resources %v\n", err)
    }

    e.Use(middleware.Logger())
    e.Use(middleware.Recover())

    srv := handler.NewDefaultServer(resolver.NewSchema(db.Client))
    srv.Use(entgql.Transactioner{TxOpener: db.Client})
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
