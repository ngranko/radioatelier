package resolver

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
    "context"
    "radioatelier/ent"
    "radioatelier/ent/schema/puuid"
    "radioatelier/graph/helper"

    "github.com/vektah/gqlparser/gqlerror"
)

// CreateUser is the resolver for the createUser field.
func (r *mutationResolver) CreateUser(ctx context.Context, input ent.CreateUserInput) (*ent.User, error) {
    hash, err := helper.HashPassword(input.Password)
    if err != nil {
        return nil, gqlerror.Errorf("Password hashing failed")
    }
    input.Password = hash

    client := ent.FromContext(ctx)
    return client.User.Create().
        SetInput(input).
        Save(ctx)
}

// UpdateUser is the resolver for the updateUser field.
func (r *mutationResolver) UpdateUser(ctx context.Context, id puuid.ID, input ent.UpdateUserInput) (*ent.User, error) {
    if input.Password != nil {
        hash, err := helper.HashPassword(*input.Password)
        if err != nil {
            return nil, gqlerror.Errorf("Password hashing failed")
        }
        *input.Password = string(hash)
    }

    client := ent.FromContext(ctx)
    return client.User.UpdateOneID(id).
        SetInput(input).Save(ctx)
}

// DeleteUser is the resolver for the deleteUser field.
func (r *mutationResolver) DeleteUser(ctx context.Context, id puuid.ID) (puuid.ID, error) {
    client := ent.FromContext(ctx)
    return id, client.User.DeleteOneID(id).Exec(ctx)
}
