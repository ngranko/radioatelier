package repository

import (
	"context"

	"radioatelier/ent"
	"radioatelier/package/adapter/db/model"
)

type collectionRepository struct {
	client *ent.Client
}

type Collection interface {
	List(ctx context.Context, after *model.Cursor, first *int, before *model.Cursor, last *int, orderBy *model.CollectionOrder, where *model.CollectionWhereInput) (*model.CollectionConnection, error)
	Create(ctx context.Context, input model.CreateCollectionInput) (*model.Collection, error)
	Update(ctx context.Context, id model.ID, input model.UpdateCollectionInput) (*model.Collection, error)
	Delete(ctx context.Context, id model.ID) (model.ID, error)
}

func NewCollectionRepository(client *ent.Client) Collection {
	return &collectionRepository{client: client}
}

func (r *collectionRepository) List(
	ctx context.Context,
	after *model.Cursor,
	first *int,
	before *model.Cursor,
	last *int,
	orderBy *model.CollectionOrder,
	where *model.CollectionWhereInput,
) (*model.CollectionConnection, error) {
	return r.client.Collection.Query().
		Paginate(ctx, after, first, before, last, ent.WithCollectionOrder(orderBy), ent.WithCollectionFilter(where.Filter))
}

func (r *collectionRepository) Create(ctx context.Context, input model.CreateCollectionInput) (*model.Collection, error) {
	return r.client.Collection.Create().SetInput(input).Save(ctx)
}

func (r *collectionRepository) Update(ctx context.Context, id model.ID, input model.UpdateCollectionInput) (*model.Collection, error) {
	return r.client.Collection.UpdateOneID(id).SetInput(input).Save(ctx)
}

func (r *collectionRepository) Delete(ctx context.Context, id model.ID) (model.ID, error) {
	return id, r.client.Collection.DeleteOneID(id).Exec(ctx)
}
