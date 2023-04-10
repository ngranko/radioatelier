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

// CreateUser is the resolver for the createUser field.
func (r *mutationResolver) CreateUser(ctx context.Context, input ent.CreateUserInput) (*ent.User, error) {
	repo := repository.NewUserRepository(db.WithTransactionalMutation(ctx))
	user := controller.NewUserController(repo)
	return user.Create(ctx, input)
}

// UpdateUser is the resolver for the updateUser field.
func (r *mutationResolver) UpdateUser(ctx context.Context, id puuid.ID, input ent.UpdateUserInput) (*ent.User, error) {
	repo := repository.NewUserRepository(db.WithTransactionalMutation(ctx))
	user := controller.NewUserController(repo)
	return user.Update(ctx, id, input)
}

// DeleteUser is the resolver for the deleteUser field.
func (r *mutationResolver) DeleteUser(ctx context.Context, id puuid.ID) (puuid.ID, error) {
	repo := repository.NewUserRepository(db.WithTransactionalMutation(ctx))
	user := controller.NewUserController(repo)
	return user.Delete(ctx, id)
}
