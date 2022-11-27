// Code generated by ent, DO NOT EDIT.

package ent

import (
	"context"
	"database/sql/driver"
	"fmt"
	"math"
	"radioatelier/ent/collection"
	"radioatelier/ent/object"
	"radioatelier/ent/objectuser"
	"radioatelier/ent/predicate"
	"radioatelier/ent/schema/puuid"
	"radioatelier/ent/user"

	"entgo.io/ent/dialect/sql"
	"entgo.io/ent/dialect/sql/sqlgraph"
	"entgo.io/ent/schema/field"
)

// UserQuery is the builder for querying User entities.
type UserQuery struct {
	config
	limit      *int
	offset     *int
	unique     *bool
	order      []OrderFunc
	fields     []string
	predicates []predicate.User
	// eager-loading edges.
	withCreatedObjects     *ObjectQuery
	withUpdatedObjects     *ObjectQuery
	withDeletedObjects     *ObjectQuery
	withCreatedCollections *CollectionQuery
	withUpdatedCollections *CollectionQuery
	withCollections        *CollectionQuery
	withObjectInfo         *ObjectQuery
	withObjectUser         *ObjectUserQuery
	modifiers              []func(*sql.Selector)
	loadTotal              []func(context.Context, []*User) error
	// intermediate query (i.e. traversal path).
	sql  *sql.Selector
	path func(context.Context) (*sql.Selector, error)
}

// Where adds a new predicate for the UserQuery builder.
func (uq *UserQuery) Where(ps ...predicate.User) *UserQuery {
	uq.predicates = append(uq.predicates, ps...)
	return uq
}

// Limit adds a limit step to the query.
func (uq *UserQuery) Limit(limit int) *UserQuery {
	uq.limit = &limit
	return uq
}

// Offset adds an offset step to the query.
func (uq *UserQuery) Offset(offset int) *UserQuery {
	uq.offset = &offset
	return uq
}

// Unique configures the query builder to filter duplicate records on query.
// By default, unique is set to true, and can be disabled using this method.
func (uq *UserQuery) Unique(unique bool) *UserQuery {
	uq.unique = &unique
	return uq
}

// Order adds an order step to the query.
func (uq *UserQuery) Order(o ...OrderFunc) *UserQuery {
	uq.order = append(uq.order, o...)
	return uq
}

// QueryCreatedObjects chains the current query on the "created_objects" edge.
func (uq *UserQuery) QueryCreatedObjects() *ObjectQuery {
	query := &ObjectQuery{config: uq.config}
	query.path = func(ctx context.Context) (fromU *sql.Selector, err error) {
		if err := uq.prepareQuery(ctx); err != nil {
			return nil, err
		}
		selector := uq.sqlQuery(ctx)
		if err := selector.Err(); err != nil {
			return nil, err
		}
		step := sqlgraph.NewStep(
			sqlgraph.From(user.Table, user.FieldID, selector),
			sqlgraph.To(object.Table, object.FieldID),
			sqlgraph.Edge(sqlgraph.O2M, false, user.CreatedObjectsTable, user.CreatedObjectsColumn),
		)
		fromU = sqlgraph.SetNeighbors(uq.driver.Dialect(), step)
		return fromU, nil
	}
	return query
}

// QueryUpdatedObjects chains the current query on the "updated_objects" edge.
func (uq *UserQuery) QueryUpdatedObjects() *ObjectQuery {
	query := &ObjectQuery{config: uq.config}
	query.path = func(ctx context.Context) (fromU *sql.Selector, err error) {
		if err := uq.prepareQuery(ctx); err != nil {
			return nil, err
		}
		selector := uq.sqlQuery(ctx)
		if err := selector.Err(); err != nil {
			return nil, err
		}
		step := sqlgraph.NewStep(
			sqlgraph.From(user.Table, user.FieldID, selector),
			sqlgraph.To(object.Table, object.FieldID),
			sqlgraph.Edge(sqlgraph.O2M, false, user.UpdatedObjectsTable, user.UpdatedObjectsColumn),
		)
		fromU = sqlgraph.SetNeighbors(uq.driver.Dialect(), step)
		return fromU, nil
	}
	return query
}

// QueryDeletedObjects chains the current query on the "deleted_objects" edge.
func (uq *UserQuery) QueryDeletedObjects() *ObjectQuery {
	query := &ObjectQuery{config: uq.config}
	query.path = func(ctx context.Context) (fromU *sql.Selector, err error) {
		if err := uq.prepareQuery(ctx); err != nil {
			return nil, err
		}
		selector := uq.sqlQuery(ctx)
		if err := selector.Err(); err != nil {
			return nil, err
		}
		step := sqlgraph.NewStep(
			sqlgraph.From(user.Table, user.FieldID, selector),
			sqlgraph.To(object.Table, object.FieldID),
			sqlgraph.Edge(sqlgraph.O2M, false, user.DeletedObjectsTable, user.DeletedObjectsColumn),
		)
		fromU = sqlgraph.SetNeighbors(uq.driver.Dialect(), step)
		return fromU, nil
	}
	return query
}

// QueryCreatedCollections chains the current query on the "created_collections" edge.
func (uq *UserQuery) QueryCreatedCollections() *CollectionQuery {
	query := &CollectionQuery{config: uq.config}
	query.path = func(ctx context.Context) (fromU *sql.Selector, err error) {
		if err := uq.prepareQuery(ctx); err != nil {
			return nil, err
		}
		selector := uq.sqlQuery(ctx)
		if err := selector.Err(); err != nil {
			return nil, err
		}
		step := sqlgraph.NewStep(
			sqlgraph.From(user.Table, user.FieldID, selector),
			sqlgraph.To(collection.Table, collection.FieldID),
			sqlgraph.Edge(sqlgraph.O2M, false, user.CreatedCollectionsTable, user.CreatedCollectionsColumn),
		)
		fromU = sqlgraph.SetNeighbors(uq.driver.Dialect(), step)
		return fromU, nil
	}
	return query
}

// QueryUpdatedCollections chains the current query on the "updated_collections" edge.
func (uq *UserQuery) QueryUpdatedCollections() *CollectionQuery {
	query := &CollectionQuery{config: uq.config}
	query.path = func(ctx context.Context) (fromU *sql.Selector, err error) {
		if err := uq.prepareQuery(ctx); err != nil {
			return nil, err
		}
		selector := uq.sqlQuery(ctx)
		if err := selector.Err(); err != nil {
			return nil, err
		}
		step := sqlgraph.NewStep(
			sqlgraph.From(user.Table, user.FieldID, selector),
			sqlgraph.To(collection.Table, collection.FieldID),
			sqlgraph.Edge(sqlgraph.O2M, false, user.UpdatedCollectionsTable, user.UpdatedCollectionsColumn),
		)
		fromU = sqlgraph.SetNeighbors(uq.driver.Dialect(), step)
		return fromU, nil
	}
	return query
}

// QueryCollections chains the current query on the "collections" edge.
func (uq *UserQuery) QueryCollections() *CollectionQuery {
	query := &CollectionQuery{config: uq.config}
	query.path = func(ctx context.Context) (fromU *sql.Selector, err error) {
		if err := uq.prepareQuery(ctx); err != nil {
			return nil, err
		}
		selector := uq.sqlQuery(ctx)
		if err := selector.Err(); err != nil {
			return nil, err
		}
		step := sqlgraph.NewStep(
			sqlgraph.From(user.Table, user.FieldID, selector),
			sqlgraph.To(collection.Table, collection.FieldID),
			sqlgraph.Edge(sqlgraph.M2M, false, user.CollectionsTable, user.CollectionsPrimaryKey...),
		)
		fromU = sqlgraph.SetNeighbors(uq.driver.Dialect(), step)
		return fromU, nil
	}
	return query
}

// QueryObjectInfo chains the current query on the "object_info" edge.
func (uq *UserQuery) QueryObjectInfo() *ObjectQuery {
	query := &ObjectQuery{config: uq.config}
	query.path = func(ctx context.Context) (fromU *sql.Selector, err error) {
		if err := uq.prepareQuery(ctx); err != nil {
			return nil, err
		}
		selector := uq.sqlQuery(ctx)
		if err := selector.Err(); err != nil {
			return nil, err
		}
		step := sqlgraph.NewStep(
			sqlgraph.From(user.Table, user.FieldID, selector),
			sqlgraph.To(object.Table, object.FieldID),
			sqlgraph.Edge(sqlgraph.M2M, false, user.ObjectInfoTable, user.ObjectInfoPrimaryKey...),
		)
		fromU = sqlgraph.SetNeighbors(uq.driver.Dialect(), step)
		return fromU, nil
	}
	return query
}

// QueryObjectUser chains the current query on the "object_user" edge.
func (uq *UserQuery) QueryObjectUser() *ObjectUserQuery {
	query := &ObjectUserQuery{config: uq.config}
	query.path = func(ctx context.Context) (fromU *sql.Selector, err error) {
		if err := uq.prepareQuery(ctx); err != nil {
			return nil, err
		}
		selector := uq.sqlQuery(ctx)
		if err := selector.Err(); err != nil {
			return nil, err
		}
		step := sqlgraph.NewStep(
			sqlgraph.From(user.Table, user.FieldID, selector),
			sqlgraph.To(objectuser.Table, objectuser.UserColumn),
			sqlgraph.Edge(sqlgraph.O2M, true, user.ObjectUserTable, user.ObjectUserColumn),
		)
		fromU = sqlgraph.SetNeighbors(uq.driver.Dialect(), step)
		return fromU, nil
	}
	return query
}

// First returns the first User entity from the query.
// Returns a *NotFoundError when no User was found.
func (uq *UserQuery) First(ctx context.Context) (*User, error) {
	nodes, err := uq.Limit(1).All(ctx)
	if err != nil {
		return nil, err
	}
	if len(nodes) == 0 {
		return nil, &NotFoundError{user.Label}
	}
	return nodes[0], nil
}

// FirstX is like First, but panics if an error occurs.
func (uq *UserQuery) FirstX(ctx context.Context) *User {
	node, err := uq.First(ctx)
	if err != nil && !IsNotFound(err) {
		panic(err)
	}
	return node
}

// FirstID returns the first User ID from the query.
// Returns a *NotFoundError when no User ID was found.
func (uq *UserQuery) FirstID(ctx context.Context) (id puuid.ID, err error) {
	var ids []puuid.ID
	if ids, err = uq.Limit(1).IDs(ctx); err != nil {
		return
	}
	if len(ids) == 0 {
		err = &NotFoundError{user.Label}
		return
	}
	return ids[0], nil
}

// FirstIDX is like FirstID, but panics if an error occurs.
func (uq *UserQuery) FirstIDX(ctx context.Context) puuid.ID {
	id, err := uq.FirstID(ctx)
	if err != nil && !IsNotFound(err) {
		panic(err)
	}
	return id
}

// Only returns a single User entity found by the query, ensuring it only returns one.
// Returns a *NotSingularError when more than one User entity is found.
// Returns a *NotFoundError when no User entities are found.
func (uq *UserQuery) Only(ctx context.Context) (*User, error) {
	nodes, err := uq.Limit(2).All(ctx)
	if err != nil {
		return nil, err
	}
	switch len(nodes) {
	case 1:
		return nodes[0], nil
	case 0:
		return nil, &NotFoundError{user.Label}
	default:
		return nil, &NotSingularError{user.Label}
	}
}

// OnlyX is like Only, but panics if an error occurs.
func (uq *UserQuery) OnlyX(ctx context.Context) *User {
	node, err := uq.Only(ctx)
	if err != nil {
		panic(err)
	}
	return node
}

// OnlyID is like Only, but returns the only User ID in the query.
// Returns a *NotSingularError when more than one User ID is found.
// Returns a *NotFoundError when no entities are found.
func (uq *UserQuery) OnlyID(ctx context.Context) (id puuid.ID, err error) {
	var ids []puuid.ID
	if ids, err = uq.Limit(2).IDs(ctx); err != nil {
		return
	}
	switch len(ids) {
	case 1:
		id = ids[0]
	case 0:
		err = &NotFoundError{user.Label}
	default:
		err = &NotSingularError{user.Label}
	}
	return
}

// OnlyIDX is like OnlyID, but panics if an error occurs.
func (uq *UserQuery) OnlyIDX(ctx context.Context) puuid.ID {
	id, err := uq.OnlyID(ctx)
	if err != nil {
		panic(err)
	}
	return id
}

// All executes the query and returns a list of Users.
func (uq *UserQuery) All(ctx context.Context) ([]*User, error) {
	if err := uq.prepareQuery(ctx); err != nil {
		return nil, err
	}
	return uq.sqlAll(ctx)
}

// AllX is like All, but panics if an error occurs.
func (uq *UserQuery) AllX(ctx context.Context) []*User {
	nodes, err := uq.All(ctx)
	if err != nil {
		panic(err)
	}
	return nodes
}

// IDs executes the query and returns a list of User IDs.
func (uq *UserQuery) IDs(ctx context.Context) ([]puuid.ID, error) {
	var ids []puuid.ID
	if err := uq.Select(user.FieldID).Scan(ctx, &ids); err != nil {
		return nil, err
	}
	return ids, nil
}

// IDsX is like IDs, but panics if an error occurs.
func (uq *UserQuery) IDsX(ctx context.Context) []puuid.ID {
	ids, err := uq.IDs(ctx)
	if err != nil {
		panic(err)
	}
	return ids
}

// Count returns the count of the given query.
func (uq *UserQuery) Count(ctx context.Context) (int, error) {
	if err := uq.prepareQuery(ctx); err != nil {
		return 0, err
	}
	return uq.sqlCount(ctx)
}

// CountX is like Count, but panics if an error occurs.
func (uq *UserQuery) CountX(ctx context.Context) int {
	count, err := uq.Count(ctx)
	if err != nil {
		panic(err)
	}
	return count
}

// Exist returns true if the query has elements in the graph.
func (uq *UserQuery) Exist(ctx context.Context) (bool, error) {
	if err := uq.prepareQuery(ctx); err != nil {
		return false, err
	}
	return uq.sqlExist(ctx)
}

// ExistX is like Exist, but panics if an error occurs.
func (uq *UserQuery) ExistX(ctx context.Context) bool {
	exist, err := uq.Exist(ctx)
	if err != nil {
		panic(err)
	}
	return exist
}

// Clone returns a duplicate of the UserQuery builder, including all associated steps. It can be
// used to prepare common query builders and use them differently after the clone is made.
func (uq *UserQuery) Clone() *UserQuery {
	if uq == nil {
		return nil
	}
	return &UserQuery{
		config:                 uq.config,
		limit:                  uq.limit,
		offset:                 uq.offset,
		order:                  append([]OrderFunc{}, uq.order...),
		predicates:             append([]predicate.User{}, uq.predicates...),
		withCreatedObjects:     uq.withCreatedObjects.Clone(),
		withUpdatedObjects:     uq.withUpdatedObjects.Clone(),
		withDeletedObjects:     uq.withDeletedObjects.Clone(),
		withCreatedCollections: uq.withCreatedCollections.Clone(),
		withUpdatedCollections: uq.withUpdatedCollections.Clone(),
		withCollections:        uq.withCollections.Clone(),
		withObjectInfo:         uq.withObjectInfo.Clone(),
		withObjectUser:         uq.withObjectUser.Clone(),
		// clone intermediate query.
		sql:    uq.sql.Clone(),
		path:   uq.path,
		unique: uq.unique,
	}
}

// WithCreatedObjects tells the query-builder to eager-load the nodes that are connected to
// the "created_objects" edge. The optional arguments are used to configure the query builder of the edge.
func (uq *UserQuery) WithCreatedObjects(opts ...func(*ObjectQuery)) *UserQuery {
	query := &ObjectQuery{config: uq.config}
	for _, opt := range opts {
		opt(query)
	}
	uq.withCreatedObjects = query
	return uq
}

// WithUpdatedObjects tells the query-builder to eager-load the nodes that are connected to
// the "updated_objects" edge. The optional arguments are used to configure the query builder of the edge.
func (uq *UserQuery) WithUpdatedObjects(opts ...func(*ObjectQuery)) *UserQuery {
	query := &ObjectQuery{config: uq.config}
	for _, opt := range opts {
		opt(query)
	}
	uq.withUpdatedObjects = query
	return uq
}

// WithDeletedObjects tells the query-builder to eager-load the nodes that are connected to
// the "deleted_objects" edge. The optional arguments are used to configure the query builder of the edge.
func (uq *UserQuery) WithDeletedObjects(opts ...func(*ObjectQuery)) *UserQuery {
	query := &ObjectQuery{config: uq.config}
	for _, opt := range opts {
		opt(query)
	}
	uq.withDeletedObjects = query
	return uq
}

// WithCreatedCollections tells the query-builder to eager-load the nodes that are connected to
// the "created_collections" edge. The optional arguments are used to configure the query builder of the edge.
func (uq *UserQuery) WithCreatedCollections(opts ...func(*CollectionQuery)) *UserQuery {
	query := &CollectionQuery{config: uq.config}
	for _, opt := range opts {
		opt(query)
	}
	uq.withCreatedCollections = query
	return uq
}

// WithUpdatedCollections tells the query-builder to eager-load the nodes that are connected to
// the "updated_collections" edge. The optional arguments are used to configure the query builder of the edge.
func (uq *UserQuery) WithUpdatedCollections(opts ...func(*CollectionQuery)) *UserQuery {
	query := &CollectionQuery{config: uq.config}
	for _, opt := range opts {
		opt(query)
	}
	uq.withUpdatedCollections = query
	return uq
}

// WithCollections tells the query-builder to eager-load the nodes that are connected to
// the "collections" edge. The optional arguments are used to configure the query builder of the edge.
func (uq *UserQuery) WithCollections(opts ...func(*CollectionQuery)) *UserQuery {
	query := &CollectionQuery{config: uq.config}
	for _, opt := range opts {
		opt(query)
	}
	uq.withCollections = query
	return uq
}

// WithObjectInfo tells the query-builder to eager-load the nodes that are connected to
// the "object_info" edge. The optional arguments are used to configure the query builder of the edge.
func (uq *UserQuery) WithObjectInfo(opts ...func(*ObjectQuery)) *UserQuery {
	query := &ObjectQuery{config: uq.config}
	for _, opt := range opts {
		opt(query)
	}
	uq.withObjectInfo = query
	return uq
}

// WithObjectUser tells the query-builder to eager-load the nodes that are connected to
// the "object_user" edge. The optional arguments are used to configure the query builder of the edge.
func (uq *UserQuery) WithObjectUser(opts ...func(*ObjectUserQuery)) *UserQuery {
	query := &ObjectUserQuery{config: uq.config}
	for _, opt := range opts {
		opt(query)
	}
	uq.withObjectUser = query
	return uq
}

// GroupBy is used to group vertices by one or more fields/columns.
// It is often used with aggregate functions, like: count, max, mean, min, sum.
//
// Example:
//
//	var v []struct {
//		Name string `json:"name,omitempty"`
//		Count int `json:"count,omitempty"`
//	}
//
//	client.User.Query().
//		GroupBy(user.FieldName).
//		Aggregate(ent.Count()).
//		Scan(ctx, &v)
func (uq *UserQuery) GroupBy(field string, fields ...string) *UserGroupBy {
	grbuild := &UserGroupBy{config: uq.config}
	grbuild.fields = append([]string{field}, fields...)
	grbuild.path = func(ctx context.Context) (prev *sql.Selector, err error) {
		if err := uq.prepareQuery(ctx); err != nil {
			return nil, err
		}
		return uq.sqlQuery(ctx), nil
	}
	grbuild.label = user.Label
	grbuild.flds, grbuild.scan = &grbuild.fields, grbuild.Scan
	return grbuild
}

// Select allows the selection one or more fields/columns for the given query,
// instead of selecting all fields in the entity.
//
// Example:
//
//	var v []struct {
//		Name string `json:"name,omitempty"`
//	}
//
//	client.User.Query().
//		Select(user.FieldName).
//		Scan(ctx, &v)
func (uq *UserQuery) Select(fields ...string) *UserSelect {
	uq.fields = append(uq.fields, fields...)
	selbuild := &UserSelect{UserQuery: uq}
	selbuild.label = user.Label
	selbuild.flds, selbuild.scan = &uq.fields, selbuild.Scan
	return selbuild
}

func (uq *UserQuery) prepareQuery(ctx context.Context) error {
	for _, f := range uq.fields {
		if !user.ValidColumn(f) {
			return &ValidationError{Name: f, err: fmt.Errorf("ent: invalid field %q for query", f)}
		}
	}
	if uq.path != nil {
		prev, err := uq.path(ctx)
		if err != nil {
			return err
		}
		uq.sql = prev
	}
	return nil
}

func (uq *UserQuery) sqlAll(ctx context.Context, hooks ...queryHook) ([]*User, error) {
	var (
		nodes       = []*User{}
		_spec       = uq.querySpec()
		loadedTypes = [8]bool{
			uq.withCreatedObjects != nil,
			uq.withUpdatedObjects != nil,
			uq.withDeletedObjects != nil,
			uq.withCreatedCollections != nil,
			uq.withUpdatedCollections != nil,
			uq.withCollections != nil,
			uq.withObjectInfo != nil,
			uq.withObjectUser != nil,
		}
	)
	_spec.ScanValues = func(columns []string) ([]interface{}, error) {
		return (*User).scanValues(nil, columns)
	}
	_spec.Assign = func(columns []string, values []interface{}) error {
		node := &User{config: uq.config}
		nodes = append(nodes, node)
		node.Edges.loadedTypes = loadedTypes
		return node.assignValues(columns, values)
	}
	if len(uq.modifiers) > 0 {
		_spec.Modifiers = uq.modifiers
	}
	for i := range hooks {
		hooks[i](ctx, _spec)
	}
	if err := sqlgraph.QueryNodes(ctx, uq.driver, _spec); err != nil {
		return nil, err
	}
	if len(nodes) == 0 {
		return nodes, nil
	}

	if query := uq.withCreatedObjects; query != nil {
		fks := make([]driver.Value, 0, len(nodes))
		nodeids := make(map[puuid.ID]*User)
		for i := range nodes {
			fks = append(fks, nodes[i].ID)
			nodeids[nodes[i].ID] = nodes[i]
			nodes[i].Edges.CreatedObjects = []*Object{}
		}
		query.withFKs = true
		query.Where(predicate.Object(func(s *sql.Selector) {
			s.Where(sql.InValues(user.CreatedObjectsColumn, fks...))
		}))
		neighbors, err := query.All(ctx)
		if err != nil {
			return nil, err
		}
		for _, n := range neighbors {
			fk := n.created_by
			if fk == nil {
				return nil, fmt.Errorf(`foreign-key "created_by" is nil for node %v`, n.ID)
			}
			node, ok := nodeids[*fk]
			if !ok {
				return nil, fmt.Errorf(`unexpected foreign-key "created_by" returned %v for node %v`, *fk, n.ID)
			}
			node.Edges.CreatedObjects = append(node.Edges.CreatedObjects, n)
		}
	}

	if query := uq.withUpdatedObjects; query != nil {
		fks := make([]driver.Value, 0, len(nodes))
		nodeids := make(map[puuid.ID]*User)
		for i := range nodes {
			fks = append(fks, nodes[i].ID)
			nodeids[nodes[i].ID] = nodes[i]
			nodes[i].Edges.UpdatedObjects = []*Object{}
		}
		query.withFKs = true
		query.Where(predicate.Object(func(s *sql.Selector) {
			s.Where(sql.InValues(user.UpdatedObjectsColumn, fks...))
		}))
		neighbors, err := query.All(ctx)
		if err != nil {
			return nil, err
		}
		for _, n := range neighbors {
			fk := n.updated_by
			if fk == nil {
				return nil, fmt.Errorf(`foreign-key "updated_by" is nil for node %v`, n.ID)
			}
			node, ok := nodeids[*fk]
			if !ok {
				return nil, fmt.Errorf(`unexpected foreign-key "updated_by" returned %v for node %v`, *fk, n.ID)
			}
			node.Edges.UpdatedObjects = append(node.Edges.UpdatedObjects, n)
		}
	}

	if query := uq.withDeletedObjects; query != nil {
		fks := make([]driver.Value, 0, len(nodes))
		nodeids := make(map[puuid.ID]*User)
		for i := range nodes {
			fks = append(fks, nodes[i].ID)
			nodeids[nodes[i].ID] = nodes[i]
			nodes[i].Edges.DeletedObjects = []*Object{}
		}
		query.withFKs = true
		query.Where(predicate.Object(func(s *sql.Selector) {
			s.Where(sql.InValues(user.DeletedObjectsColumn, fks...))
		}))
		neighbors, err := query.All(ctx)
		if err != nil {
			return nil, err
		}
		for _, n := range neighbors {
			fk := n.deleted_by
			if fk == nil {
				return nil, fmt.Errorf(`foreign-key "deleted_by" is nil for node %v`, n.ID)
			}
			node, ok := nodeids[*fk]
			if !ok {
				return nil, fmt.Errorf(`unexpected foreign-key "deleted_by" returned %v for node %v`, *fk, n.ID)
			}
			node.Edges.DeletedObjects = append(node.Edges.DeletedObjects, n)
		}
	}

	if query := uq.withCreatedCollections; query != nil {
		fks := make([]driver.Value, 0, len(nodes))
		nodeids := make(map[puuid.ID]*User)
		for i := range nodes {
			fks = append(fks, nodes[i].ID)
			nodeids[nodes[i].ID] = nodes[i]
			nodes[i].Edges.CreatedCollections = []*Collection{}
		}
		query.withFKs = true
		query.Where(predicate.Collection(func(s *sql.Selector) {
			s.Where(sql.InValues(user.CreatedCollectionsColumn, fks...))
		}))
		neighbors, err := query.All(ctx)
		if err != nil {
			return nil, err
		}
		for _, n := range neighbors {
			fk := n.created_by
			if fk == nil {
				return nil, fmt.Errorf(`foreign-key "created_by" is nil for node %v`, n.ID)
			}
			node, ok := nodeids[*fk]
			if !ok {
				return nil, fmt.Errorf(`unexpected foreign-key "created_by" returned %v for node %v`, *fk, n.ID)
			}
			node.Edges.CreatedCollections = append(node.Edges.CreatedCollections, n)
		}
	}

	if query := uq.withUpdatedCollections; query != nil {
		fks := make([]driver.Value, 0, len(nodes))
		nodeids := make(map[puuid.ID]*User)
		for i := range nodes {
			fks = append(fks, nodes[i].ID)
			nodeids[nodes[i].ID] = nodes[i]
			nodes[i].Edges.UpdatedCollections = []*Collection{}
		}
		query.withFKs = true
		query.Where(predicate.Collection(func(s *sql.Selector) {
			s.Where(sql.InValues(user.UpdatedCollectionsColumn, fks...))
		}))
		neighbors, err := query.All(ctx)
		if err != nil {
			return nil, err
		}
		for _, n := range neighbors {
			fk := n.updated_by
			if fk == nil {
				return nil, fmt.Errorf(`foreign-key "updated_by" is nil for node %v`, n.ID)
			}
			node, ok := nodeids[*fk]
			if !ok {
				return nil, fmt.Errorf(`unexpected foreign-key "updated_by" returned %v for node %v`, *fk, n.ID)
			}
			node.Edges.UpdatedCollections = append(node.Edges.UpdatedCollections, n)
		}
	}

	if query := uq.withCollections; query != nil {
		edgeids := make([]driver.Value, len(nodes))
		byid := make(map[puuid.ID]*User)
		nids := make(map[puuid.ID]map[*User]struct{})
		for i, node := range nodes {
			edgeids[i] = node.ID
			byid[node.ID] = node
			node.Edges.Collections = []*Collection{}
		}
		query.Where(func(s *sql.Selector) {
			joinT := sql.Table(user.CollectionsTable)
			s.Join(joinT).On(s.C(collection.FieldID), joinT.C(user.CollectionsPrimaryKey[1]))
			s.Where(sql.InValues(joinT.C(user.CollectionsPrimaryKey[0]), edgeids...))
			columns := s.SelectedColumns()
			s.Select(joinT.C(user.CollectionsPrimaryKey[0]))
			s.AppendSelect(columns...)
			s.SetDistinct(false)
		})
		neighbors, err := query.sqlAll(ctx, func(_ context.Context, spec *sqlgraph.QuerySpec) {
			assign := spec.Assign
			values := spec.ScanValues
			spec.ScanValues = func(columns []string) ([]interface{}, error) {
				values, err := values(columns[1:])
				if err != nil {
					return nil, err
				}
				return append([]interface{}{new(puuid.ID)}, values...), nil
			}
			spec.Assign = func(columns []string, values []interface{}) error {
				outValue := *values[0].(*puuid.ID)
				inValue := *values[1].(*puuid.ID)
				if nids[inValue] == nil {
					nids[inValue] = map[*User]struct{}{byid[outValue]: struct{}{}}
					return assign(columns[1:], values[1:])
				}
				nids[inValue][byid[outValue]] = struct{}{}
				return nil
			}
		})
		if err != nil {
			return nil, err
		}
		for _, n := range neighbors {
			nodes, ok := nids[n.ID]
			if !ok {
				return nil, fmt.Errorf(`unexpected "collections" node returned %v`, n.ID)
			}
			for kn := range nodes {
				kn.Edges.Collections = append(kn.Edges.Collections, n)
			}
		}
	}

	if query := uq.withObjectInfo; query != nil {
		edgeids := make([]driver.Value, len(nodes))
		byid := make(map[puuid.ID]*User)
		nids := make(map[puuid.ID]map[*User]struct{})
		for i, node := range nodes {
			edgeids[i] = node.ID
			byid[node.ID] = node
			node.Edges.ObjectInfo = []*Object{}
		}
		query.Where(func(s *sql.Selector) {
			joinT := sql.Table(user.ObjectInfoTable)
			s.Join(joinT).On(s.C(object.FieldID), joinT.C(user.ObjectInfoPrimaryKey[1]))
			s.Where(sql.InValues(joinT.C(user.ObjectInfoPrimaryKey[0]), edgeids...))
			columns := s.SelectedColumns()
			s.Select(joinT.C(user.ObjectInfoPrimaryKey[0]))
			s.AppendSelect(columns...)
			s.SetDistinct(false)
		})
		neighbors, err := query.sqlAll(ctx, func(_ context.Context, spec *sqlgraph.QuerySpec) {
			assign := spec.Assign
			values := spec.ScanValues
			spec.ScanValues = func(columns []string) ([]interface{}, error) {
				values, err := values(columns[1:])
				if err != nil {
					return nil, err
				}
				return append([]interface{}{new(puuid.ID)}, values...), nil
			}
			spec.Assign = func(columns []string, values []interface{}) error {
				outValue := *values[0].(*puuid.ID)
				inValue := *values[1].(*puuid.ID)
				if nids[inValue] == nil {
					nids[inValue] = map[*User]struct{}{byid[outValue]: struct{}{}}
					return assign(columns[1:], values[1:])
				}
				nids[inValue][byid[outValue]] = struct{}{}
				return nil
			}
		})
		if err != nil {
			return nil, err
		}
		for _, n := range neighbors {
			nodes, ok := nids[n.ID]
			if !ok {
				return nil, fmt.Errorf(`unexpected "object_info" node returned %v`, n.ID)
			}
			for kn := range nodes {
				kn.Edges.ObjectInfo = append(kn.Edges.ObjectInfo, n)
			}
		}
	}

	if query := uq.withObjectUser; query != nil {
		fks := make([]driver.Value, 0, len(nodes))
		nodeids := make(map[puuid.ID]*User)
		for i := range nodes {
			fks = append(fks, nodes[i].ID)
			nodeids[nodes[i].ID] = nodes[i]
			nodes[i].Edges.ObjectUser = []*ObjectUser{}
		}
		query.Where(predicate.ObjectUser(func(s *sql.Selector) {
			s.Where(sql.InValues(user.ObjectUserColumn, fks...))
		}))
		neighbors, err := query.All(ctx)
		if err != nil {
			return nil, err
		}
		for _, n := range neighbors {
			fk := n.UserID
			node, ok := nodeids[fk]
			if !ok {
				return nil, fmt.Errorf(`unexpected foreign-key "user_id" returned %v for node %v`, fk, n)
			}
			node.Edges.ObjectUser = append(node.Edges.ObjectUser, n)
		}
	}

	for i := range uq.loadTotal {
		if err := uq.loadTotal[i](ctx, nodes); err != nil {
			return nil, err
		}
	}
	return nodes, nil
}

func (uq *UserQuery) sqlCount(ctx context.Context) (int, error) {
	_spec := uq.querySpec()
	if len(uq.modifiers) > 0 {
		_spec.Modifiers = uq.modifiers
	}
	_spec.Node.Columns = uq.fields
	if len(uq.fields) > 0 {
		_spec.Unique = uq.unique != nil && *uq.unique
	}
	return sqlgraph.CountNodes(ctx, uq.driver, _spec)
}

func (uq *UserQuery) sqlExist(ctx context.Context) (bool, error) {
	n, err := uq.sqlCount(ctx)
	if err != nil {
		return false, fmt.Errorf("ent: check existence: %w", err)
	}
	return n > 0, nil
}

func (uq *UserQuery) querySpec() *sqlgraph.QuerySpec {
	_spec := &sqlgraph.QuerySpec{
		Node: &sqlgraph.NodeSpec{
			Table:   user.Table,
			Columns: user.Columns,
			ID: &sqlgraph.FieldSpec{
				Type:   field.TypeString,
				Column: user.FieldID,
			},
		},
		From:   uq.sql,
		Unique: true,
	}
	if unique := uq.unique; unique != nil {
		_spec.Unique = *unique
	}
	if fields := uq.fields; len(fields) > 0 {
		_spec.Node.Columns = make([]string, 0, len(fields))
		_spec.Node.Columns = append(_spec.Node.Columns, user.FieldID)
		for i := range fields {
			if fields[i] != user.FieldID {
				_spec.Node.Columns = append(_spec.Node.Columns, fields[i])
			}
		}
	}
	if ps := uq.predicates; len(ps) > 0 {
		_spec.Predicate = func(selector *sql.Selector) {
			for i := range ps {
				ps[i](selector)
			}
		}
	}
	if limit := uq.limit; limit != nil {
		_spec.Limit = *limit
	}
	if offset := uq.offset; offset != nil {
		_spec.Offset = *offset
	}
	if ps := uq.order; len(ps) > 0 {
		_spec.Order = func(selector *sql.Selector) {
			for i := range ps {
				ps[i](selector)
			}
		}
	}
	return _spec
}

func (uq *UserQuery) sqlQuery(ctx context.Context) *sql.Selector {
	builder := sql.Dialect(uq.driver.Dialect())
	t1 := builder.Table(user.Table)
	columns := uq.fields
	if len(columns) == 0 {
		columns = user.Columns
	}
	selector := builder.Select(t1.Columns(columns...)...).From(t1)
	if uq.sql != nil {
		selector = uq.sql
		selector.Select(selector.Columns(columns...)...)
	}
	if uq.unique != nil && *uq.unique {
		selector.Distinct()
	}
	for _, p := range uq.predicates {
		p(selector)
	}
	for _, p := range uq.order {
		p(selector)
	}
	if offset := uq.offset; offset != nil {
		// limit is mandatory for offset clause. We start
		// with default value, and override it below if needed.
		selector.Offset(*offset).Limit(math.MaxInt32)
	}
	if limit := uq.limit; limit != nil {
		selector.Limit(*limit)
	}
	return selector
}

// UserGroupBy is the group-by builder for User entities.
type UserGroupBy struct {
	config
	selector
	fields []string
	fns    []AggregateFunc
	// intermediate query (i.e. traversal path).
	sql  *sql.Selector
	path func(context.Context) (*sql.Selector, error)
}

// Aggregate adds the given aggregation functions to the group-by query.
func (ugb *UserGroupBy) Aggregate(fns ...AggregateFunc) *UserGroupBy {
	ugb.fns = append(ugb.fns, fns...)
	return ugb
}

// Scan applies the group-by query and scans the result into the given value.
func (ugb *UserGroupBy) Scan(ctx context.Context, v interface{}) error {
	query, err := ugb.path(ctx)
	if err != nil {
		return err
	}
	ugb.sql = query
	return ugb.sqlScan(ctx, v)
}

func (ugb *UserGroupBy) sqlScan(ctx context.Context, v interface{}) error {
	for _, f := range ugb.fields {
		if !user.ValidColumn(f) {
			return &ValidationError{Name: f, err: fmt.Errorf("invalid field %q for group-by", f)}
		}
	}
	selector := ugb.sqlQuery()
	if err := selector.Err(); err != nil {
		return err
	}
	rows := &sql.Rows{}
	query, args := selector.Query()
	if err := ugb.driver.Query(ctx, query, args, rows); err != nil {
		return err
	}
	defer rows.Close()
	return sql.ScanSlice(rows, v)
}

func (ugb *UserGroupBy) sqlQuery() *sql.Selector {
	selector := ugb.sql.Select()
	aggregation := make([]string, 0, len(ugb.fns))
	for _, fn := range ugb.fns {
		aggregation = append(aggregation, fn(selector))
	}
	// If no columns were selected in a custom aggregation function, the default
	// selection is the fields used for "group-by", and the aggregation functions.
	if len(selector.SelectedColumns()) == 0 {
		columns := make([]string, 0, len(ugb.fields)+len(ugb.fns))
		for _, f := range ugb.fields {
			columns = append(columns, selector.C(f))
		}
		columns = append(columns, aggregation...)
		selector.Select(columns...)
	}
	return selector.GroupBy(selector.Columns(ugb.fields...)...)
}

// UserSelect is the builder for selecting fields of User entities.
type UserSelect struct {
	*UserQuery
	selector
	// intermediate query (i.e. traversal path).
	sql *sql.Selector
}

// Scan applies the selector query and scans the result into the given value.
func (us *UserSelect) Scan(ctx context.Context, v interface{}) error {
	if err := us.prepareQuery(ctx); err != nil {
		return err
	}
	us.sql = us.UserQuery.sqlQuery(ctx)
	return us.sqlScan(ctx, v)
}

func (us *UserSelect) sqlScan(ctx context.Context, v interface{}) error {
	rows := &sql.Rows{}
	query, args := us.sql.Query()
	if err := us.driver.Query(ctx, query, args, rows); err != nil {
		return err
	}
	defer rows.Close()
	return sql.ScanSlice(rows, v)
}
