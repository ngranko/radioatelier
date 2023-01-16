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

// User holds the schema definition for the User entity.
type User struct {
    ent.Schema
}

func (User) Mixin() []ent.Mixin {
    return []ent.Mixin{
        puuid.MixinWithPrefix("UR"),
    }
}

// Fields of the User.
func (User) Fields() []ent.Field {
    return []ent.Field{
        field.String("name").
            SchemaType(map[string]string{
                dialect.MySQL: "varchar(50)",
            }).
            Annotations(
                entgql.OrderField("NAME"),
            ),
        field.String("email").
            Unique().
            SchemaType(map[string]string{
                dialect.MySQL: "varchar(50)",
            }),
        field.String("login").
            Unique().
            SchemaType(map[string]string{
                dialect.MySQL: "varchar(24)",
            }),
        field.String("password").
            Sensitive().
            SchemaType(map[string]string{
                dialect.MySQL: "char(60)",
            }).
            Annotations(
                entgql.Skip(entgql.SkipType),
                entgql.Skip(entgql.SkipWhereInput),
                entgql.Skip(entgql.SkipOrderField),
            ),
        field.String("role").
            SchemaType(map[string]string{
                dialect.MySQL: "varchar(10)",
            }),
        field.Time("last_login").
            Optional().
            Nillable(),
        field.Bool("is_active").
            Default(true),
        field.String("notion_id").
            Optional().
            Nillable().
            SchemaType(map[string]string{
                dialect.MySQL: "char(36) binary",
            }),
        field.Bool("is_notion_subject").
            Default(false),
    }
}

// Edges of the User.
func (User) Edges() []ent.Edge {
    return []ent.Edge{
        edge.To("created_objects", Object.Type).
            StorageKey(edge.Column("created_by")),
        edge.To("updated_objects", Object.Type).
            StorageKey(edge.Column("updated_by")),
        edge.To("deleted_objects", Object.Type).
            StorageKey(edge.Column("deleted_by")),
        edge.To("created_collections", Collection.Type).
            StorageKey(edge.Column("created_by")),
        edge.To("updated_collections", Collection.Type).
            StorageKey(edge.Column("updated_by")),
        edge.To("collections", Collection.Type),
        edge.To("object_info", Object.Type).
            Through("object_user", ObjectUser.Type),
    }
}

// Annotations of the User.
func (User) Annotations() []schema.Annotation {
    return []schema.Annotation{
        entgql.RelayConnection(),
        entgql.QueryField(),
        entgql.Mutations(
            entgql.MutationCreate(),
            entgql.MutationUpdate(),
        ),
        entsql.Annotation{
            Collation: "utf8mb4_0900_ai_ci",
        },
    }
}
