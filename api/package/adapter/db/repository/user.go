package repository

import (
    "context"

    "radioatelier/ent"
    "radioatelier/package/adapter/db/model"
)

type userRepository struct {
    client *ent.Client
}

type User interface {
    List(ctx context.Context, after *model.Cursor, first *int, before *model.Cursor, last *int, orderBy *model.UserOrder, where *model.UserWhereInput) (*model.UserConnection, error)
    Create(ctx context.Context, input model.CreateUserInput) (*model.User, error)
    Update(ctx context.Context, id model.ID, input model.UpdateUserInput) (*model.User, error)
    Delete(ctx context.Context, id model.ID) (model.ID, error)
}

func NewUserRepository(client *ent.Client) User {
    return &userRepository{client: client}
}

func (r *userRepository) List(
    ctx context.Context,
    after *model.Cursor,
    first *int,
    before *model.Cursor,
    last *int,
    orderBy *model.UserOrder,
    where *model.UserWhereInput,
) (*model.UserConnection, error) {
    return r.client.User.Query().
        Paginate(ctx, after, first, before, last, ent.WithUserOrder(orderBy), ent.WithUserFilter(where.Filter))
}

func (r *userRepository) Create(ctx context.Context, input model.CreateUserInput) (*model.User, error) {
    return r.client.User.Create().SetInput(input).Save(ctx)
}

func (r *userRepository) Update(ctx context.Context, id model.ID, input model.UpdateUserInput) (*model.User, error) {
    return r.client.User.UpdateOneID(id).SetInput(input).Save(ctx)
}

func (r *userRepository) Delete(ctx context.Context, id model.ID) (model.ID, error) {
    return id, r.client.User.DeleteOneID(id).Exec(ctx)
}
