package resolver

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
    "context"
    "radioatelier/ent"
    "radioatelier/ent/schema/puuid"
)

// CreateCollection is the resolver for the createCollection field.
func (r *mutationResolver) CreateCollection(ctx context.Context, input ent.CreateCollectionInput) (*ent.Collection, error) {
    client := ent.FromContext(ctx)
    return client.Collection.Create().
        SetInput(input).
        Save(ctx)
}

// UpdateCollection is the resolver for the updateCollection field.
func (r *mutationResolver) UpdateCollection(ctx context.Context, id puuid.ID, input ent.UpdateCollectionInput) (*ent.Collection, error) {
    client := ent.FromContext(ctx)
    return client.Collection.UpdateOneID(id).
        SetInput(input).
        Save(ctx)
}

// DeleteCollection is the resolver for the deleteCollection field.
func (r *mutationResolver) DeleteCollection(ctx context.Context, id puuid.ID) (puuid.ID, error) {
    client := ent.FromContext(ctx)
    return id, client.Collection.DeleteOneID(id).Exec(ctx)
}
