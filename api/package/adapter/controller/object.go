package controller

import (
	"context"

	"radioatelier/package/adapter/db/model"
	"radioatelier/package/adapter/db/repository"
)

type object struct {
	repo repository.Object
}

type Object interface {
	Get(ctx context.Context, id model.ID) (*model.Object, error)
	List(ctx context.Context, after *model.Cursor, first *int, before *model.Cursor, last *int, orderBy *model.ObjectOrder, where *model.ObjectWhereInput) (*model.ObjectConnection, error)
	Create(ctx context.Context, input model.CreateObjectInput) (*model.Object, error)
	Update(ctx context.Context, id model.ID, input model.UpdateObjectInput) (*model.Object, error)
	Delete(ctx context.Context, id model.ID) (model.ID, error)
}

func NewObjectController(repo repository.Object) Object {
	return &object{repo}
}

func (c *object) Get(ctx context.Context, id model.ID) (*model.Object, error) {
	return c.repo.Get(ctx, id)
}

func (c *object) List(
	ctx context.Context,
	after *model.Cursor,
	first *int,
	before *model.Cursor,
	last *int,
	orderBy *model.ObjectOrder,
	where *model.ObjectWhereInput,
) (*model.ObjectConnection, error) {
	return c.repo.List(ctx, after, first, before, last, orderBy, where)
}

func (c *object) Create(ctx context.Context, input model.CreateObjectInput) (*model.Object, error) {
	return c.repo.Create(ctx, input)
}

func (c *object) Update(ctx context.Context, id model.ID, input model.UpdateObjectInput) (*model.Object, error) {
	return c.repo.Update(ctx, id, input)
}

func (c *object) Delete(ctx context.Context, id model.ID) (model.ID, error) {
	return c.repo.Delete(ctx, id)
}
