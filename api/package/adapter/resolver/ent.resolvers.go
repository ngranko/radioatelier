package resolver

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
    "context"

    "radioatelier/ent"
    "radioatelier/ent/schema/puuid"
    "radioatelier/graph/generated"
    "radioatelier/package/adapter/controller"
    repository2 "radioatelier/package/adapter/db/repository"
)

// Node is the resolver for the node field.
func (r *queryResolver) Node(ctx context.Context, id puuid.ID) (ent.Noder, error) {
    return r.client.Noder(ctx, id, ent.WithNodeType(ent.IDToType))
}

// Nodes is the resolver for the nodes field.
func (r *queryResolver) Nodes(ctx context.Context, ids []puuid.ID) ([]ent.Noder, error) {
    return r.client.Noders(ctx, ids, ent.WithNodeType(ent.IDToType))
}

// Cities is the resolver for the cities field.
func (r *queryResolver) Cities(ctx context.Context, after *ent.Cursor, first *int, before *ent.Cursor, last *int, orderBy *ent.CityOrder, where *ent.CityWhereInput) (*ent.CityConnection, error) {
    repo := repository2.NewCityRepository(r.client)
    city := controller.NewCityController(repo)
    return city.List(ctx, after, first, before, last, orderBy, where)
}

// Collections is the resolver for the collections field.
func (r *queryResolver) Collections(ctx context.Context, after *ent.Cursor, first *int, before *ent.Cursor, last *int, orderBy *ent.CollectionOrder, where *ent.CollectionWhereInput) (*ent.CollectionConnection, error) {
    repo := repository2.NewCollectionRepository(r.client)
    collection := controller.NewCollectionController(repo)
    return collection.List(ctx, after, first, before, last, orderBy, where)
}

// Objects is the resolver for the objects field.
func (r *queryResolver) Objects(ctx context.Context, after *ent.Cursor, first *int, before *ent.Cursor, last *int, orderBy *ent.ObjectOrder, where *ent.ObjectWhereInput) (*ent.ObjectConnection, error) {
    repo := repository2.NewObjectRepository(r.client)
    object := controller.NewObjectController(repo)
    return object.List(ctx, after, first, before, last, orderBy, where)
}

// Users is the resolver for the users field.
func (r *queryResolver) Users(ctx context.Context, after *ent.Cursor, first *int, before *ent.Cursor, last *int, orderBy *ent.UserOrder, where *ent.UserWhereInput) (*ent.UserConnection, error) {
    repo := repository2.NewUserRepository(r.client)
    user := controller.NewUserController(repo)
    return user.List(ctx, after, first, before, last, orderBy, where)
}

// Query returns generated.QueryResolver implementation.
func (r *Resolver) Query() generated.QueryResolver { return &queryResolver{r} }

type queryResolver struct{ *Resolver }
