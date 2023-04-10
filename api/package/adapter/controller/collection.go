package controller

import (
	"context"

	"radioatelier/package/adapter/db/model"
	"radioatelier/package/adapter/db/repository"
)

type collection struct {
	repo repository.Collection
}

type Collection interface {
	List(ctx context.Context, after *model.Cursor, first *int, before *model.Cursor, last *int, orderBy *model.CollectionOrder, where *model.CollectionWhereInput) (*model.CollectionConnection, error)
	Create(ctx context.Context, input model.CreateCollectionInput) (*model.Collection, error)
	Update(ctx context.Context, id model.ID, input model.UpdateCollectionInput) (*model.Collection, error)
	Delete(ctx context.Context, id model.ID) (model.ID, error)
}

func NewCollectionController(repo repository.Collection) Collection {
	return &collection{repo}
}

func (c *collection) List(
	ctx context.Context,
	after *model.Cursor,
	first *int,
	before *model.Cursor,
	last *int,
	orderBy *model.CollectionOrder,
	where *model.CollectionWhereInput,
) (*model.CollectionConnection, error) {
	return c.repo.List(ctx, after, first, before, last, orderBy, where)
}

func (c *collection) Create(ctx context.Context, input model.CreateCollectionInput) (*model.Collection, error) {
	return c.repo.Create(ctx, input)
}

func (c *collection) Update(ctx context.Context, id model.ID, input model.UpdateCollectionInput) (*model.Collection, error) {
	return c.repo.Update(ctx, id, input)
}

func (c *collection) Delete(ctx context.Context, id model.ID) (model.ID, error) {
	return c.repo.Delete(ctx, id)
}
