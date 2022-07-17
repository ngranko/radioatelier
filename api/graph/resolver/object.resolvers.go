package resolver

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"context"
	"radioatelier/ent"
	"radioatelier/ent/schema/puuid"
)

// CreateObject is the resolver for the createObject field.
func (r *mutationResolver) CreateObject(ctx context.Context, input ent.CreateObjectInput) (*ent.Object, error) {
	client := ent.FromContext(ctx)
	return client.Object.Create().
		SetInput(input).
		Save(ctx)
}

// UpdateObject is the resolver for the updateObject field.
func (r *mutationResolver) UpdateObject(ctx context.Context, id puuid.ID, input ent.UpdateObjectInput) (*ent.Object, error) {
	client := ent.FromContext(ctx)
	return client.Object.UpdateOneID(id).
		SetInput(input).
		Save(ctx)
}

// DeleteObject is the resolver for the deleteObject field.
func (r *mutationResolver) DeleteObject(ctx context.Context, id puuid.ID) (puuid.ID, error) {
	client := ent.FromContext(ctx)
	return id, client.Object.DeleteOneID(id).Exec(ctx)
}
