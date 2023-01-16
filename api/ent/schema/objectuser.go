package schema

import (
    "entgo.io/ent/dialect/entsql"
    "radioatelier/ent/schema/puuid"

    "entgo.io/contrib/entgql"
    "entgo.io/ent"

    "entgo.io/ent/dialect"
    "entgo.io/ent/schema"
    "entgo.io/ent/schema/edge"
    "entgo.io/ent/schema/field"
)

// ObjectUser holds the schema definition for the ObjectUser entity.
type ObjectUser struct {
    ent.Schema
}

// Fields of the ObjectUser.
func (ObjectUser) Fields() []ent.Field {
    return []ent.Field{
        field.String("user_id").
            GoType(puuid.ID("")).
            SchemaType(map[string]string{
                dialect.MySQL: "char(39)",
            }),
        field.String("object_id").
            GoType(puuid.ID("")).
            SchemaType(map[string]string{
                dialect.MySQL: "char(39)",
            }),
        field.Bool("is_visited").Default(false),
        field.Time("last_visit").Optional().Nillable().
            SchemaType(map[string]string{
                dialect.MySQL: "date",
            }),
    }
}

// Edges of the ObjectUser.
func (ObjectUser) Edges() []ent.Edge {
    return []ent.Edge{
        edge.To("user", User.Type).
            Unique().
            Required().
            Field("user_id"),
        edge.To("object", Object.Type).
            Unique().
            Required().
            Field("object_id").
            Annotations(entsql.Annotation{
                OnDelete: entsql.Cascade,
            }),
    }
}

// Annotations of the ObjectUser.
func (ObjectUser) Annotations() []schema.Annotation {
    return []schema.Annotation{
        field.ID("user_id", "object_id"),
        entgql.RelayConnection(),
        entgql.QueryField(),
        entgql.Mutations(
            entgql.MutationUpdate(),
        ),
        entsql.Annotation{
            Collation: "utf8mb4_0900_ai_ci",
        },
    }
}
