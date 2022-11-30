package resolver

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"context"
	"radioatelier/ent"
    "radioatelier/ent/object"
    "radioatelier/ent/schema/puuid"
    "radioatelier/package/sync"
)

// CreateObject is the resolver for the createObject field.
func (r *mutationResolver) CreateObject(ctx context.Context, input ent.CreateObjectInput) (*ent.Object, error) {
	client := ent.FromContext(ctx)
	obj, err := client.Object.Create().
		SetInput(input).
		Save(ctx)
    if err != nil {
        return obj, err
    }

    sync.ToNotion(obj)
    return obj, err
}

// UpdateObject is the resolver for the updateObject field.
func (r *mutationResolver) UpdateObject(ctx context.Context, id puuid.ID, input ent.UpdateObjectInput) (*ent.Object, error) {
	client := ent.FromContext(ctx)
	obj, err := client.Object.UpdateOneID(id).
		SetInput(input).
		Save(ctx)
    if err != nil {
        return obj, err
    }

    sync.ToNotion(obj)
    return obj, err
}

// DeleteObject is the resolver for the deleteObject field.
// TODO: do we need actual deletion if all that we want to do is soft delete?
func (r *mutationResolver) DeleteObject(ctx context.Context, id puuid.ID) (puuid.ID, error) {
	client := ent.FromContext(ctx)
//	return id, client.Object.DeleteOneID(id).Exec(ctx)
	err := client.Object.DeleteOneID(id).Exec(ctx)
    if err != nil {
        return id, err
    }

    obj, err := client.Object.Query().Where(object.IDEQ(id)).First(ctx)
    if err != nil {
        return id, err
    }
    sync.ToNotion(obj)
    return id, err
}
