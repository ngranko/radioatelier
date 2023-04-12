package repository

import (
    "context"

    "radioatelier/ent"
    "radioatelier/package/adapter/db/model"
)

type cityRepository struct {
    client *ent.Client
}

type City interface {
    List(ctx context.Context, after *model.Cursor, first *int, before *model.Cursor, last *int, orderBy *model.CityOrder, where *model.CityWhereInput) (*model.CityConnection, error)
    Create(ctx context.Context, input model.CreateCityInput) (*model.City, error)
    Update(ctx context.Context, id model.ID, input model.UpdateCityInput) (*model.City, error)
    Delete(ctx context.Context, id model.ID) (model.ID, error)
}

func NewCityRepository(client *ent.Client) City {
    return &cityRepository{client: client}
}

func (r *cityRepository) List(
    ctx context.Context,
    after *model.Cursor,
    first *int,
    before *model.Cursor,
    last *int,
    orderBy *model.CityOrder,
    where *model.CityWhereInput,
) (*model.CityConnection, error) {
    return r.client.City.Query().
        Paginate(ctx, after, first, before, last, ent.WithCityOrder(orderBy), ent.WithCityFilter(where.Filter))
}

func (r *cityRepository) Create(ctx context.Context, input model.CreateCityInput) (*model.City, error) {
    return r.client.City.Create().SetInput(input).Save(ctx)
}

func (r *cityRepository) Update(ctx context.Context, id model.ID, input model.UpdateCityInput) (*model.City, error) {
    return r.client.City.UpdateOneID(id).SetInput(input).Save(ctx)
}

func (r *cityRepository) Delete(ctx context.Context, id model.ID) (model.ID, error) {
    return id, r.client.City.DeleteOneID(id).Exec(ctx)
}
