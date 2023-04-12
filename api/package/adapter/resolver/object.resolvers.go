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

// CreateObject is the resolver for the createObject field.
func (r *mutationResolver) CreateObject(ctx context.Context, input ent.CreateObjectInput) (*ent.Object, error) {
    repo := repository.NewObjectRepository(db.WithTransactionalMutation(ctx))
    object := controller.NewObjectController(repo)
    obj, err := object.Create(ctx, input)
    if err != nil {
        return obj, err
    }

    // TODO: this is an old sync, remove it when the new one is up and running
    //    sync.ToNotion(obj)
    return obj, err
}

// UpdateObject is the resolver for the updateObject field.
func (r *mutationResolver) UpdateObject(ctx context.Context, id puuid.ID, input ent.UpdateObjectInput) (*ent.Object, error) {
    repo := repository.NewObjectRepository(db.WithTransactionalMutation(ctx))
    object := controller.NewObjectController(repo)
    obj, err := object.Update(ctx, id, input)
    if err != nil {
        return obj, err
    }

    // TODO: this is an old sync, remove it when the new one is up and running
    //    sync.ToNotion(obj)
    return obj, err
}

// DeleteObject is the resolver for the deleteObject field.
func (r *mutationResolver) DeleteObject(ctx context.Context, id puuid.ID) (puuid.ID, error) {
    repo := repository.NewObjectRepository(db.WithTransactionalMutation(ctx))
    object := controller.NewObjectController(repo)
    id, err := object.Delete(ctx, id)
    if err != nil {
        return id, err
    }

    _, err = object.Get(ctx, id)
    if err != nil {
        return id, err
    }
    //    sync.ToNotion(obj)
    return id, err
}
