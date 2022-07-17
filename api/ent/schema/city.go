package schema

import (
	"radioatelier/ent/schema/puuid"

	"entgo.io/contrib/entgql"
	"entgo.io/ent"
	"entgo.io/ent/dialect"
	"entgo.io/ent/schema"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
)

// City holds the schema definition for the City entity.
type City struct {
	ent.Schema
}

func (City) Mixin() []ent.Mixin {
	return []ent.Mixin{
		puuid.MixinWithPrefix("CT"),
	}
}

// Fields of the City.
func (City) Fields() []ent.Field {
	return []ent.Field{
		field.String("name").
			SchemaType(map[string]string{
				dialect.MySQL: "varchar(50)",
			}),
		field.String("country").
			SchemaType(map[string]string{
				dialect.MySQL: "varchar(50)",
			}),
	}
}

// Edges of the City.
func (City) Edges() []ent.Edge {
	return []ent.Edge{
		edge.To("objects", Object.Type).StorageKey(edge.Column("city_id")),
	}
}

// Annotations of the City.
func (City) Annotations() []schema.Annotation {
	return []schema.Annotation{
		entgql.RelayConnection(),
		entgql.QueryField(),
		entgql.Mutations(
			entgql.MutationCreate(),
			entgql.MutationUpdate(),
		),
	}
}
