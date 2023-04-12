package repository

import (
    "context"

    "radioatelier/ent"
    "radioatelier/ent/object"
    "radioatelier/package/adapter/db/model"
)

type objectRepository struct {
    client *ent.Client
}

type Object interface {
    Get(ctx context.Context, id model.ID) (*model.Object, error)
    List(ctx context.Context, after *model.Cursor, first *int, before *model.Cursor, last *int, orderBy *model.ObjectOrder, where *model.ObjectWhereInput) (*model.ObjectConnection, error)
    Create(ctx context.Context, input model.CreateObjectInput) (*model.Object, error)
    Update(ctx context.Context, id model.ID, input model.UpdateObjectInput) (*model.Object, error)
    Delete(ctx context.Context, id model.ID) (model.ID, error)
}

func NewObjectRepository(client *ent.Client) Object {
    return &objectRepository{client: client}
}

func (r *objectRepository) Get(ctx context.Context, id model.ID) (*model.Object, error) {
    return r.client.Object.Query().Where(object.IDEQ(id)).First(ctx)
}

func (r *objectRepository) List(
    ctx context.Context,
    after *model.Cursor,
    first *int,
    before *model.Cursor,
    last *int,
    orderBy *model.ObjectOrder,
    where *model.ObjectWhereInput,
) (*model.ObjectConnection, error) {
    return r.client.Object.Query().
        Paginate(ctx, after, first, before, last, ent.WithObjectOrder(orderBy), ent.WithObjectFilter(where.Filter))
}

func (r *objectRepository) Create(ctx context.Context, input model.CreateObjectInput) (*model.Object, error) {
    return r.client.Object.Create().SetInput(input).Save(ctx)
}

func (r *objectRepository) Update(ctx context.Context, id model.ID, input model.UpdateObjectInput) (*model.Object, error) {
    return r.client.Object.UpdateOneID(id).SetInput(input).Save(ctx)
}

func (r *objectRepository) Delete(ctx context.Context, id model.ID) (model.ID, error) {
    return id, r.client.Object.DeleteOneID(id).Exec(ctx)
}
