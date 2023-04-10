package hook

import (
	"context"

	"entgo.io/ent/dialect/entsql"
	"entgo.io/ent/dialect/sql/schema"
)

// SetSchemaCollation automatically changes all database tables to the set collation
func SetSchemaCollation(next schema.Creator) schema.Creator {
	ant := &entsql.Annotation{Collation: "utf8mb4_0900_ai_ci"}

	return schema.CreateFunc(func(ctx context.Context, tables ...*schema.Table) error {
		for _, t := range tables {
			if t.Annotation == nil {
				t.Annotation = ant
			} else {
				t.Annotation.Merge(ant)
			}
		}
		return next.Create(ctx, tables...)
	})
}
