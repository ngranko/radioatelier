package resolver

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
    "context"
    "radioatelier/ent"
    "radioatelier/ent/schema/puuid"
    "radioatelier/graph/generated"
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
func (r *queryResolver) Cities(ctx context.Context, after *ent.Cursor, first *int, before *ent.Cursor, last *int, where *ent.CityWhereInput) (*ent.CityConnection, error) {
    return r.client.City.Query().
        Paginate(ctx, after, first, before, last,
            // ent.WithCityOrder(orderBy),
            ent.WithCityFilter(where.Filter),
        )
}

// Collections is the resolver for the collections field.
func (r *queryResolver) Collections(ctx context.Context, after *ent.Cursor, first *int, before *ent.Cursor, last *int, orderBy *ent.CollectionOrder, where *ent.CollectionWhereInput) (*ent.CollectionConnection, error) {
    return r.client.Collection.Query().
        Paginate(ctx, after, first, before, last,
            ent.WithCollectionOrder(orderBy),
            ent.WithCollectionFilter(where.Filter),
        )
}

// Objects is the resolver for the objects field.
func (r *queryResolver) Objects(ctx context.Context, after *ent.Cursor, first *int, before *ent.Cursor, last *int, where *ent.ObjectWhereInput) (*ent.ObjectConnection, error) {
    return r.client.Object.Query().
        Paginate(ctx, after, first, before, last,
            // ent.WithObjectOrder(orderBy),
            ent.WithObjectFilter(where.Filter),
        )
}

// Users is the resolver for the users field.
func (r *queryResolver) Users(ctx context.Context, after *ent.Cursor, first *int, before *ent.Cursor, last *int, orderBy *ent.UserOrder, where *ent.UserWhereInput) (*ent.UserConnection, error) {
    return r.client.User.Query().
        Paginate(ctx, after, first, before, last,
            ent.WithUserOrder(orderBy),
            ent.WithUserFilter(where.Filter),
        )
}

// Query returns generated.QueryResolver implementation.
func (r *Resolver) Query() generated.QueryResolver { return &queryResolver{r} }

type queryResolver struct{ *Resolver }
