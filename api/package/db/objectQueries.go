package db

import (
	"context"
	"radioatelier/ent"
	"radioatelier/ent/object"
	"time"
)

func GetLastSync(ctx context.Context) *time.Time {
	obj, err := Client.Object.Query().
		Unique(true).
		Select(object.FieldLastSync).
		Order(ent.Desc(object.FieldLastSync)).
		First(ctx)
	if err == nil {
		return obj.LastSync
	}

	return nil
}
