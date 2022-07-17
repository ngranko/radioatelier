//go:build ignore
// +build ignore

package main

import (
	"log"

	"entgo.io/contrib/entgql"
	"entgo.io/ent/entc"
	"entgo.io/ent/entc/gen"
)

func main() {
	templates := entgql.AllTemplates

	templates = append(templates, gen.MustParse(
		gen.NewTemplate("puuid.tmpl").
			ParseFiles("./ent/schema/puuid/template/puuid.tmpl")),
	)
	ex, err := entgql.NewExtension(
		entgql.WithConfigPath("./gqlgen.yml"),
		entgql.WithSchemaPath("./ent.graphql"),
		entgql.WithWhereInputs(true),
		entgql.WithSchemaGenerator(),
	)
	if err != nil {
		log.Fatalf("Error: failed creating entgql extension: %v", err)
	}
	opts := []entc.Option{
		entc.Extensions(ex),
	}
	if err := entc.Generate("./ent/schema", &gen.Config{Templates: templates}, opts...); err != nil {
		log.Fatalf("Error: failed running ent codegen: %v", err)
	}
}
