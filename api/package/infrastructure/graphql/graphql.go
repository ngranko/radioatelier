package graphql

import (
    "entgo.io/contrib/entgql"
    "github.com/99designs/gqlgen/graphql/handler"

    "radioatelier/ent"
    "radioatelier/package/adapter/resolver"
)

func NewServer(client *ent.Client) *handler.Server {
    srv := handler.NewDefaultServer(resolver.NewSchema(client))
    srv.Use(entgql.Transactioner{TxOpener: client})

    return srv
}
