package schema

import (
	"radioatelier/ent/schema/puuid"
	"time"

	"entgo.io/contrib/entgql"
	"entgo.io/ent"
	"entgo.io/ent/dialect"
	"entgo.io/ent/schema"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
)

// Collection holds the schema definition for the Collection entity.
type Collection struct {
	ent.Schema
}

func (Collection) Mixin() []ent.Mixin {
	return []ent.Mixin{
		puuid.MixinWithPrefix("CN"),
	}
}

// Fields of the Collection.
func (Collection) Fields() []ent.Field {
	return []ent.Field{
		field.String("name").
			SchemaType(map[string]string{
				dialect.MySQL: "varchar(100)",
			}).
			Annotations(
				entgql.OrderField("NAME"),
			),
		field.String("description").Optional().
			SchemaType(map[string]string{
				dialect.MySQL: "varchar(255)",
			}),
		field.Time("created_at").
			Immutable().
			Default(time.Now).
			Annotations(
				entgql.OrderField("CREATED_AT"),
			),
		field.Time("updated_at").
			Default(time.Now).
			UpdateDefault(time.Now).
			Annotations(
				entgql.OrderField("UPDATED_AT"),
			),
	}
}

// Edges of the Collection.
func (Collection) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("created_by", User.Type).Ref("created_collections").Unique().Required(),
		edge.From("updated_by", User.Type).Ref("updated_collections").Unique().Required(),
		edge.From("objects", Object.Type).Ref("collections"),
		edge.From("users", User.Type).Ref("collections"),
	}
}

// Annotations of the Collection.
func (Collection) Annotations() []schema.Annotation {
	return []schema.Annotation{
		entgql.RelayConnection(),
		entgql.QueryField(),
		entgql.Mutations(
			entgql.MutationCreate(),
			entgql.MutationUpdate(),
		),
	}
}
