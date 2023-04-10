package resolver

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"context"

	"radioatelier/ent"
	"radioatelier/ent/schema/puuid"
	"radioatelier/graph/generated"
	"radioatelier/package/adapter/controller"
	"radioatelier/package/adapter/db/repository"
	"radioatelier/package/infrastructure/db"
)

// CreateCity is the resolver for the createCity field.
func (r *mutationResolver) CreateCity(ctx context.Context, input ent.CreateCityInput) (*ent.City, error) {
	repo := repository.NewCityRepository(db.WithTransactionalMutation(ctx))
	city := controller.NewCityController(repo)
	return city.Create(ctx, input)
}

// UpdateCity is the resolver for the updateCity field.
func (r *mutationResolver) UpdateCity(ctx context.Context, id puuid.ID, input ent.UpdateCityInput) (*ent.City, error) {
	repo := repository.NewCityRepository(db.WithTransactionalMutation(ctx))
	city := controller.NewCityController(repo)
	return city.Update(ctx, id, input)
}

// DeleteCity is the resolver for the deleteCity field.
func (r *mutationResolver) DeleteCity(ctx context.Context, id puuid.ID) (puuid.ID, error) {
	repo := repository.NewCityRepository(db.WithTransactionalMutation(ctx))
	city := controller.NewCityController(repo)
	return city.Delete(ctx, id)
}

// Mutation returns generated.MutationResolver implementation.
func (r *Resolver) Mutation() generated.MutationResolver { return &mutationResolver{r} }

type mutationResolver struct{ *Resolver }
