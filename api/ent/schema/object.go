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

// Object holds the schema definition for the Object entity.
type Object struct {
	ent.Schema
}

func (Object) Mixin() []ent.Mixin {
	return []ent.Mixin{
		puuid.MixinWithPrefix("OB"),
	}
}

// Fields of the Object.
func (Object) Fields() []ent.Field {
	return []ent.Field{
		field.String("name"),
		field.String("description").Optional(),
		field.Float("lat").
			Optional().Nillable().
			SchemaType(map[string]string{
				dialect.MySQL: "decimal(9,6)",
			}),
		field.Float("lng").
			Optional().Nillable().
			SchemaType(map[string]string{
				dialect.MySQL: "decimal(9,6)",
			}),
		field.String("installed_period").
			Optional().Nillable().
			SchemaType(map[string]string{
				dialect.MySQL: "varchar(10)",
			}),
		field.Bool("is_removed").Default(false),
		field.String("removed_period").
			Optional().Nillable().
			SchemaType(map[string]string{
				dialect.MySQL: "varchar(10)",
			}),
		field.String("source").Optional().Nillable(),
		field.String("type").
			SchemaType(map[string]string{
				dialect.MySQL: "varchar(24)",
			}),
		field.String("tags").
			SchemaType(map[string]string{
				dialect.MySQL: "varchar(100)",
			}),
		field.Time("created_at").Immutable().Default(time.Now),
		field.Time("updated_at").Default(time.Now).UpdateDefault(time.Now),
		field.Time("deleted_at").Optional().Nillable(),
		field.Time("last_sync").Optional().Nillable(),
		field.String("notion_id").
			Optional().Nillable().
			SchemaType(map[string]string{
				dialect.MySQL: "char(36) binary",
			}),
	}
}

// Edges of the Object.
func (Object) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("created_by", User.Type).Ref("created_objects").Unique().Required(),
		edge.From("updated_by", User.Type).Ref("updated_objects").Unique().Required(),
		edge.From("deleted_by", User.Type).Ref("deleted_objects").Unique(),
		edge.To("collections", Collection.Type),
		edge.From("user_info", User.Type).Ref("object_info").Through("object_user", ObjectUser.Type),
		edge.From("city", City.Type).Ref("objects").Unique().Required(),
	}
}

// Annotations of the Object.
func (Object) Annotations() []schema.Annotation {
	return []schema.Annotation{
		entgql.RelayConnection(),
		entgql.QueryField(),
		entgql.Mutations(
			entgql.MutationCreate(),
			entgql.MutationUpdate(),
		),
	}
}
