package resolver

import (
	"github.com/99designs/gqlgen/graphql"

	"radioatelier/ent"
	"radioatelier/graph/generated"
)

type Resolver struct {
	client *ent.Client
}

func NewSchema(client *ent.Client) graphql.ExecutableSchema {
	return generated.NewExecutableSchema(generated.Config{
		Resolvers: &Resolver{
			client,
		},
	})
}
