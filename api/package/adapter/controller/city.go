package controller

import (
	"context"

	"radioatelier/package/adapter/db/model"
	"radioatelier/package/adapter/db/repository"
)

type city struct {
	repo repository.City
}

type City interface {
	List(ctx context.Context, after *model.Cursor, first *int, before *model.Cursor, last *int, orderBy *model.CityOrder, where *model.CityWhereInput) (*model.CityConnection, error)
	Create(ctx context.Context, input model.CreateCityInput) (*model.City, error)
	Update(ctx context.Context, id model.ID, input model.UpdateCityInput) (*model.City, error)
	Delete(ctx context.Context, id model.ID) (model.ID, error)
}

func NewCityController(repo repository.City) City {
	return &city{repo}
}

func (c *city) List(
	ctx context.Context,
	after *model.Cursor,
	first *int,
	before *model.Cursor,
	last *int,
	orderBy *model.CityOrder,
	where *model.CityWhereInput,
) (*model.CityConnection, error) {
	return c.repo.List(ctx, after, first, before, last, orderBy, where)
}

func (c *city) Create(ctx context.Context, input model.CreateCityInput) (*model.City, error) {
	return c.repo.Create(ctx, input)
}

func (c *city) Update(ctx context.Context, id model.ID, input model.UpdateCityInput) (*model.City, error) {
	return c.repo.Update(ctx, id, input)
}

func (c *city) Delete(ctx context.Context, id model.ID) (model.ID, error) {
	return c.repo.Delete(ctx, id)
}
