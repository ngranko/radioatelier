package db

import (
	"context"

	"radioatelier/ent"
)

func WithTransactionalMutation(ctx context.Context) *ent.Client {
	return ent.FromContext(ctx)
}
