package resolver

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"context"

	"radioatelier/ent"
	"radioatelier/ent/schema/puuid"
	"radioatelier/package/adapter/controller"
	"radioatelier/package/adapter/db/repository"
	"radioatelier/package/infrastructure/db"
)

// CreateCollection is the resolver for the createCollection field.
func (r *mutationResolver) CreateCollection(ctx context.Context, input ent.CreateCollectionInput) (*ent.Collection, error) {
	repo := repository.NewCollectionRepository(db.WithTransactionalMutation(ctx))
	collection := controller.NewCollectionController(repo)
	return collection.Create(ctx, input)
}

// UpdateCollection is the resolver for the updateCollection field.
func (r *mutationResolver) UpdateCollection(ctx context.Context, id puuid.ID, input ent.UpdateCollectionInput) (*ent.Collection, error) {
	repo := repository.NewCollectionRepository(db.WithTransactionalMutation(ctx))
	collection := controller.NewCollectionController(repo)
	return collection.Update(ctx, id, input)
}

// DeleteCollection is the resolver for the deleteCollection field.
func (r *mutationResolver) DeleteCollection(ctx context.Context, id puuid.ID) (puuid.ID, error) {
	repo := repository.NewCollectionRepository(db.WithTransactionalMutation(ctx))
	collection := controller.NewCollectionController(repo)
	return collection.Delete(ctx, id)
}
