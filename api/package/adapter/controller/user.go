package controller

import (
	"context"

	"github.com/vektah/gqlparser/gqlerror"

	"radioatelier/package/adapter/db/model"
	"radioatelier/package/adapter/db/repository"
	"radioatelier/package/adapter/password"
)

type user struct {
	repo repository.User
}

type User interface {
	List(ctx context.Context, after *model.Cursor, first *int, before *model.Cursor, last *int, orderBy *model.UserOrder, where *model.UserWhereInput) (*model.UserConnection, error)
	Create(ctx context.Context, input model.CreateUserInput) (*model.User, error)
	Update(ctx context.Context, id model.ID, input model.UpdateUserInput) (*model.User, error)
	Delete(ctx context.Context, id model.ID) (model.ID, error)
}

func NewUserController(repo repository.User) User {
	return &user{repo}
}

func (u *user) List(
	ctx context.Context,
	after *model.Cursor,
	first *int,
	before *model.Cursor,
	last *int,
	orderBy *model.UserOrder,
	where *model.UserWhereInput,
) (*model.UserConnection, error) {
	return u.repo.List(ctx, after, first, before, last, orderBy, where)
}

func (u *user) Create(ctx context.Context, input model.CreateUserInput) (*model.User, error) {
	pass := password.NewFromRaw(input.Password)
	hash, err := pass.Hash()
	if err != nil {
		return nil, gqlerror.Errorf("password hashing failed: %q", err.Error())
	}
	input.Password = hash

	return u.repo.Create(ctx, input)
}

func (u *user) Update(ctx context.Context, id model.ID, input model.UpdateUserInput) (*model.User, error) {
	if input.Password != nil {
		pass := password.NewFromRaw(*input.Password)
		hash, err := pass.Hash()
		if err != nil {
			return nil, gqlerror.Errorf("password hashing failed: %q", err.Error())
		}
		*input.Password = hash
	}

	return u.repo.Update(ctx, id, input)
}

func (u *user) Delete(ctx context.Context, id model.ID) (model.ID, error) {
	return u.repo.Delete(ctx, id)
}
