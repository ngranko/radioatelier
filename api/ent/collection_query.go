// Code generated by ent, DO NOT EDIT.

package ent

import (
	"context"
	"database/sql/driver"
	"fmt"
	"math"
	"radioatelier/ent/collection"
	"radioatelier/ent/object"
	"radioatelier/ent/predicate"
	"radioatelier/ent/schema/puuid"
	"radioatelier/ent/user"

	"entgo.io/ent/dialect/sql"
	"entgo.io/ent/dialect/sql/sqlgraph"
	"entgo.io/ent/schema/field"
)

// CollectionQuery is the builder for querying Collection entities.
type CollectionQuery struct {
	config
	limit      *int
	offset     *int
	unique     *bool
	order      []OrderFunc
	fields     []string
	predicates []predicate.Collection
	// eager-loading edges.
	withCreatedBy *UserQuery
	withUpdatedBy *UserQuery
	withObjects   *ObjectQuery
	withUsers     *UserQuery
	withFKs       bool
	modifiers     []func(*sql.Selector)
	loadTotal     []func(context.Context, []*Collection) error
	// intermediate query (i.e. traversal path).
	sql  *sql.Selector
	path func(context.Context) (*sql.Selector, error)
}

// Where adds a new predicate for the CollectionQuery builder.
func (cq *CollectionQuery) Where(ps ...predicate.Collection) *CollectionQuery {
	cq.predicates = append(cq.predicates, ps...)
	return cq
}

// Limit adds a limit step to the query.
func (cq *CollectionQuery) Limit(limit int) *CollectionQuery {
	cq.limit = &limit
	return cq
}

// Offset adds an offset step to the query.
func (cq *CollectionQuery) Offset(offset int) *CollectionQuery {
	cq.offset = &offset
	return cq
}

// Unique configures the query builder to filter duplicate records on query.
// By default, unique is set to true, and can be disabled using this method.
func (cq *CollectionQuery) Unique(unique bool) *CollectionQuery {
	cq.unique = &unique
	return cq
}

// Order adds an order step to the query.
func (cq *CollectionQuery) Order(o ...OrderFunc) *CollectionQuery {
	cq.order = append(cq.order, o...)
	return cq
}

// QueryCreatedBy chains the current query on the "created_by" edge.
func (cq *CollectionQuery) QueryCreatedBy() *UserQuery {
	query := &UserQuery{config: cq.config}
	query.path = func(ctx context.Context) (fromU *sql.Selector, err error) {
		if err := cq.prepareQuery(ctx); err != nil {
			return nil, err
		}
		selector := cq.sqlQuery(ctx)
		if err := selector.Err(); err != nil {
			return nil, err
		}
		step := sqlgraph.NewStep(
			sqlgraph.From(collection.Table, collection.FieldID, selector),
			sqlgraph.To(user.Table, user.FieldID),
			sqlgraph.Edge(sqlgraph.M2O, true, collection.CreatedByTable, collection.CreatedByColumn),
		)
		fromU = sqlgraph.SetNeighbors(cq.driver.Dialect(), step)
		return fromU, nil
	}
	return query
}

// QueryUpdatedBy chains the current query on the "updated_by" edge.
func (cq *CollectionQuery) QueryUpdatedBy() *UserQuery {
	query := &UserQuery{config: cq.config}
	query.path = func(ctx context.Context) (fromU *sql.Selector, err error) {
		if err := cq.prepareQuery(ctx); err != nil {
			return nil, err
		}
		selector := cq.sqlQuery(ctx)
		if err := selector.Err(); err != nil {
			return nil, err
		}
		step := sqlgraph.NewStep(
			sqlgraph.From(collection.Table, collection.FieldID, selector),
			sqlgraph.To(user.Table, user.FieldID),
			sqlgraph.Edge(sqlgraph.M2O, true, collection.UpdatedByTable, collection.UpdatedByColumn),
		)
		fromU = sqlgraph.SetNeighbors(cq.driver.Dialect(), step)
		return fromU, nil
	}
	return query
}

// QueryObjects chains the current query on the "objects" edge.
func (cq *CollectionQuery) QueryObjects() *ObjectQuery {
	query := &ObjectQuery{config: cq.config}
	query.path = func(ctx context.Context) (fromU *sql.Selector, err error) {
		if err := cq.prepareQuery(ctx); err != nil {
			return nil, err
		}
		selector := cq.sqlQuery(ctx)
		if err := selector.Err(); err != nil {
			return nil, err
		}
		step := sqlgraph.NewStep(
			sqlgraph.From(collection.Table, collection.FieldID, selector),
			sqlgraph.To(object.Table, object.FieldID),
			sqlgraph.Edge(sqlgraph.M2M, true, collection.ObjectsTable, collection.ObjectsPrimaryKey...),
		)
		fromU = sqlgraph.SetNeighbors(cq.driver.Dialect(), step)
		return fromU, nil
	}
	return query
}

// QueryUsers chains the current query on the "users" edge.
func (cq *CollectionQuery) QueryUsers() *UserQuery {
	query := &UserQuery{config: cq.config}
	query.path = func(ctx context.Context) (fromU *sql.Selector, err error) {
		if err := cq.prepareQuery(ctx); err != nil {
			return nil, err
		}
		selector := cq.sqlQuery(ctx)
		if err := selector.Err(); err != nil {
			return nil, err
		}
		step := sqlgraph.NewStep(
			sqlgraph.From(collection.Table, collection.FieldID, selector),
			sqlgraph.To(user.Table, user.FieldID),
			sqlgraph.Edge(sqlgraph.M2M, true, collection.UsersTable, collection.UsersPrimaryKey...),
		)
		fromU = sqlgraph.SetNeighbors(cq.driver.Dialect(), step)
		return fromU, nil
	}
	return query
}

// First returns the first Collection entity from the query.
// Returns a *NotFoundError when no Collection was found.
func (cq *CollectionQuery) First(ctx context.Context) (*Collection, error) {
	nodes, err := cq.Limit(1).All(ctx)
	if err != nil {
		return nil, err
	}
	if len(nodes) == 0 {
		return nil, &NotFoundError{collection.Label}
	}
	return nodes[0], nil
}

// FirstX is like First, but panics if an error occurs.
func (cq *CollectionQuery) FirstX(ctx context.Context) *Collection {
	node, err := cq.First(ctx)
	if err != nil && !IsNotFound(err) {
		panic(err)
	}
	return node
}

// FirstID returns the first Collection ID from the query.
// Returns a *NotFoundError when no Collection ID was found.
func (cq *CollectionQuery) FirstID(ctx context.Context) (id puuid.ID, err error) {
	var ids []puuid.ID
	if ids, err = cq.Limit(1).IDs(ctx); err != nil {
		return
	}
	if len(ids) == 0 {
		err = &NotFoundError{collection.Label}
		return
	}
	return ids[0], nil
}

// FirstIDX is like FirstID, but panics if an error occurs.
func (cq *CollectionQuery) FirstIDX(ctx context.Context) puuid.ID {
	id, err := cq.FirstID(ctx)
	if err != nil && !IsNotFound(err) {
		panic(err)
	}
	return id
}

// Only returns a single Collection entity found by the query, ensuring it only returns one.
// Returns a *NotSingularError when more than one Collection entity is found.
// Returns a *NotFoundError when no Collection entities are found.
func (cq *CollectionQuery) Only(ctx context.Context) (*Collection, error) {
	nodes, err := cq.Limit(2).All(ctx)
	if err != nil {
		return nil, err
	}
	switch len(nodes) {
	case 1:
		return nodes[0], nil
	case 0:
		return nil, &NotFoundError{collection.Label}
	default:
		return nil, &NotSingularError{collection.Label}
	}
}

// OnlyX is like Only, but panics if an error occurs.
func (cq *CollectionQuery) OnlyX(ctx context.Context) *Collection {
	node, err := cq.Only(ctx)
	if err != nil {
		panic(err)
	}
	return node
}

// OnlyID is like Only, but returns the only Collection ID in the query.
// Returns a *NotSingularError when more than one Collection ID is found.
// Returns a *NotFoundError when no entities are found.
func (cq *CollectionQuery) OnlyID(ctx context.Context) (id puuid.ID, err error) {
	var ids []puuid.ID
	if ids, err = cq.Limit(2).IDs(ctx); err != nil {
		return
	}
	switch len(ids) {
	case 1:
		id = ids[0]
	case 0:
		err = &NotFoundError{collection.Label}
	default:
		err = &NotSingularError{collection.Label}
	}
	return
}

// OnlyIDX is like OnlyID, but panics if an error occurs.
func (cq *CollectionQuery) OnlyIDX(ctx context.Context) puuid.ID {
	id, err := cq.OnlyID(ctx)
	if err != nil {
		panic(err)
	}
	return id
}

// All executes the query and returns a list of Collections.
func (cq *CollectionQuery) All(ctx context.Context) ([]*Collection, error) {
	if err := cq.prepareQuery(ctx); err != nil {
		return nil, err
	}
	return cq.sqlAll(ctx)
}

// AllX is like All, but panics if an error occurs.
func (cq *CollectionQuery) AllX(ctx context.Context) []*Collection {
	nodes, err := cq.All(ctx)
	if err != nil {
		panic(err)
	}
	return nodes
}

// IDs executes the query and returns a list of Collection IDs.
func (cq *CollectionQuery) IDs(ctx context.Context) ([]puuid.ID, error) {
	var ids []puuid.ID
	if err := cq.Select(collection.FieldID).Scan(ctx, &ids); err != nil {
		return nil, err
	}
	return ids, nil
}

// IDsX is like IDs, but panics if an error occurs.
func (cq *CollectionQuery) IDsX(ctx context.Context) []puuid.ID {
	ids, err := cq.IDs(ctx)
	if err != nil {
		panic(err)
	}
	return ids
}

// Count returns the count of the given query.
func (cq *CollectionQuery) Count(ctx context.Context) (int, error) {
	if err := cq.prepareQuery(ctx); err != nil {
		return 0, err
	}
	return cq.sqlCount(ctx)
}

// CountX is like Count, but panics if an error occurs.
func (cq *CollectionQuery) CountX(ctx context.Context) int {
	count, err := cq.Count(ctx)
	if err != nil {
		panic(err)
	}
	return count
}

// Exist returns true if the query has elements in the graph.
func (cq *CollectionQuery) Exist(ctx context.Context) (bool, error) {
	if err := cq.prepareQuery(ctx); err != nil {
		return false, err
	}
	return cq.sqlExist(ctx)
}

// ExistX is like Exist, but panics if an error occurs.
func (cq *CollectionQuery) ExistX(ctx context.Context) bool {
	exist, err := cq.Exist(ctx)
	if err != nil {
		panic(err)
	}
	return exist
}

// Clone returns a duplicate of the CollectionQuery builder, including all associated steps. It can be
// used to prepare common query builders and use them differently after the clone is made.
func (cq *CollectionQuery) Clone() *CollectionQuery {
	if cq == nil {
		return nil
	}
	return &CollectionQuery{
		config:        cq.config,
		limit:         cq.limit,
		offset:        cq.offset,
		order:         append([]OrderFunc{}, cq.order...),
		predicates:    append([]predicate.Collection{}, cq.predicates...),
		withCreatedBy: cq.withCreatedBy.Clone(),
		withUpdatedBy: cq.withUpdatedBy.Clone(),
		withObjects:   cq.withObjects.Clone(),
		withUsers:     cq.withUsers.Clone(),
		// clone intermediate query.
		sql:    cq.sql.Clone(),
		path:   cq.path,
		unique: cq.unique,
	}
}

// WithCreatedBy tells the query-builder to eager-load the nodes that are connected to
// the "created_by" edge. The optional arguments are used to configure the query builder of the edge.
func (cq *CollectionQuery) WithCreatedBy(opts ...func(*UserQuery)) *CollectionQuery {
	query := &UserQuery{config: cq.config}
	for _, opt := range opts {
		opt(query)
	}
	cq.withCreatedBy = query
	return cq
}

// WithUpdatedBy tells the query-builder to eager-load the nodes that are connected to
// the "updated_by" edge. The optional arguments are used to configure the query builder of the edge.
func (cq *CollectionQuery) WithUpdatedBy(opts ...func(*UserQuery)) *CollectionQuery {
	query := &UserQuery{config: cq.config}
	for _, opt := range opts {
		opt(query)
	}
	cq.withUpdatedBy = query
	return cq
}

// WithObjects tells the query-builder to eager-load the nodes that are connected to
// the "objects" edge. The optional arguments are used to configure the query builder of the edge.
func (cq *CollectionQuery) WithObjects(opts ...func(*ObjectQuery)) *CollectionQuery {
	query := &ObjectQuery{config: cq.config}
	for _, opt := range opts {
		opt(query)
	}
	cq.withObjects = query
	return cq
}

// WithUsers tells the query-builder to eager-load the nodes that are connected to
// the "users" edge. The optional arguments are used to configure the query builder of the edge.
func (cq *CollectionQuery) WithUsers(opts ...func(*UserQuery)) *CollectionQuery {
	query := &UserQuery{config: cq.config}
	for _, opt := range opts {
		opt(query)
	}
	cq.withUsers = query
	return cq
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
//	client.Collection.Query().
//		GroupBy(collection.FieldName).
//		Aggregate(ent.Count()).
//		Scan(ctx, &v)
func (cq *CollectionQuery) GroupBy(field string, fields ...string) *CollectionGroupBy {
	grbuild := &CollectionGroupBy{config: cq.config}
	grbuild.fields = append([]string{field}, fields...)
	grbuild.path = func(ctx context.Context) (prev *sql.Selector, err error) {
		if err := cq.prepareQuery(ctx); err != nil {
			return nil, err
		}
		return cq.sqlQuery(ctx), nil
	}
	grbuild.label = collection.Label
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
//	client.Collection.Query().
//		Select(collection.FieldName).
//		Scan(ctx, &v)
func (cq *CollectionQuery) Select(fields ...string) *CollectionSelect {
	cq.fields = append(cq.fields, fields...)
	selbuild := &CollectionSelect{CollectionQuery: cq}
	selbuild.label = collection.Label
	selbuild.flds, selbuild.scan = &cq.fields, selbuild.Scan
	return selbuild
}

func (cq *CollectionQuery) prepareQuery(ctx context.Context) error {
	for _, f := range cq.fields {
		if !collection.ValidColumn(f) {
			return &ValidationError{Name: f, err: fmt.Errorf("ent: invalid field %q for query", f)}
		}
	}
	if cq.path != nil {
		prev, err := cq.path(ctx)
		if err != nil {
			return err
		}
		cq.sql = prev
	}
	return nil
}

func (cq *CollectionQuery) sqlAll(ctx context.Context, hooks ...queryHook) ([]*Collection, error) {
	var (
		nodes       = []*Collection{}
		withFKs     = cq.withFKs
		_spec       = cq.querySpec()
		loadedTypes = [4]bool{
			cq.withCreatedBy != nil,
			cq.withUpdatedBy != nil,
			cq.withObjects != nil,
			cq.withUsers != nil,
		}
	)
	if cq.withCreatedBy != nil || cq.withUpdatedBy != nil {
		withFKs = true
	}
	if withFKs {
		_spec.Node.Columns = append(_spec.Node.Columns, collection.ForeignKeys...)
	}
	_spec.ScanValues = func(columns []string) ([]interface{}, error) {
		return (*Collection).scanValues(nil, columns)
	}
	_spec.Assign = func(columns []string, values []interface{}) error {
		node := &Collection{config: cq.config}
		nodes = append(nodes, node)
		node.Edges.loadedTypes = loadedTypes
		return node.assignValues(columns, values)
	}
	if len(cq.modifiers) > 0 {
		_spec.Modifiers = cq.modifiers
	}
	for i := range hooks {
		hooks[i](ctx, _spec)
	}
	if err := sqlgraph.QueryNodes(ctx, cq.driver, _spec); err != nil {
		return nil, err
	}
	if len(nodes) == 0 {
		return nodes, nil
	}

	if query := cq.withCreatedBy; query != nil {
		ids := make([]puuid.ID, 0, len(nodes))
		nodeids := make(map[puuid.ID][]*Collection)
		for i := range nodes {
			if nodes[i].created_by == nil {
				continue
			}
			fk := *nodes[i].created_by
			if _, ok := nodeids[fk]; !ok {
				ids = append(ids, fk)
			}
			nodeids[fk] = append(nodeids[fk], nodes[i])
		}
		query.Where(user.IDIn(ids...))
		neighbors, err := query.All(ctx)
		if err != nil {
			return nil, err
		}
		for _, n := range neighbors {
			nodes, ok := nodeids[n.ID]
			if !ok {
				return nil, fmt.Errorf(`unexpected foreign-key "created_by" returned %v`, n.ID)
			}
			for i := range nodes {
				nodes[i].Edges.CreatedBy = n
			}
		}
	}

	if query := cq.withUpdatedBy; query != nil {
		ids := make([]puuid.ID, 0, len(nodes))
		nodeids := make(map[puuid.ID][]*Collection)
		for i := range nodes {
			if nodes[i].updated_by == nil {
				continue
			}
			fk := *nodes[i].updated_by
			if _, ok := nodeids[fk]; !ok {
				ids = append(ids, fk)
			}
			nodeids[fk] = append(nodeids[fk], nodes[i])
		}
		query.Where(user.IDIn(ids...))
		neighbors, err := query.All(ctx)
		if err != nil {
			return nil, err
		}
		for _, n := range neighbors {
			nodes, ok := nodeids[n.ID]
			if !ok {
				return nil, fmt.Errorf(`unexpected foreign-key "updated_by" returned %v`, n.ID)
			}
			for i := range nodes {
				nodes[i].Edges.UpdatedBy = n
			}
		}
	}

	if query := cq.withObjects; query != nil {
		edgeids := make([]driver.Value, len(nodes))
		byid := make(map[puuid.ID]*Collection)
		nids := make(map[puuid.ID]map[*Collection]struct{})
		for i, node := range nodes {
			edgeids[i] = node.ID
			byid[node.ID] = node
			node.Edges.Objects = []*Object{}
		}
		query.Where(func(s *sql.Selector) {
			joinT := sql.Table(collection.ObjectsTable)
			s.Join(joinT).On(s.C(object.FieldID), joinT.C(collection.ObjectsPrimaryKey[0]))
			s.Where(sql.InValues(joinT.C(collection.ObjectsPrimaryKey[1]), edgeids...))
			columns := s.SelectedColumns()
			s.Select(joinT.C(collection.ObjectsPrimaryKey[1]))
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
					nids[inValue] = map[*Collection]struct{}{byid[outValue]: struct{}{}}
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
				return nil, fmt.Errorf(`unexpected "objects" node returned %v`, n.ID)
			}
			for kn := range nodes {
				kn.Edges.Objects = append(kn.Edges.Objects, n)
			}
		}
	}

	if query := cq.withUsers; query != nil {
		edgeids := make([]driver.Value, len(nodes))
		byid := make(map[puuid.ID]*Collection)
		nids := make(map[puuid.ID]map[*Collection]struct{})
		for i, node := range nodes {
			edgeids[i] = node.ID
			byid[node.ID] = node
			node.Edges.Users = []*User{}
		}
		query.Where(func(s *sql.Selector) {
			joinT := sql.Table(collection.UsersTable)
			s.Join(joinT).On(s.C(user.FieldID), joinT.C(collection.UsersPrimaryKey[0]))
			s.Where(sql.InValues(joinT.C(collection.UsersPrimaryKey[1]), edgeids...))
			columns := s.SelectedColumns()
			s.Select(joinT.C(collection.UsersPrimaryKey[1]))
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
					nids[inValue] = map[*Collection]struct{}{byid[outValue]: struct{}{}}
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
				return nil, fmt.Errorf(`unexpected "users" node returned %v`, n.ID)
			}
			for kn := range nodes {
				kn.Edges.Users = append(kn.Edges.Users, n)
			}
		}
	}

	for i := range cq.loadTotal {
		if err := cq.loadTotal[i](ctx, nodes); err != nil {
			return nil, err
		}
	}
	return nodes, nil
}

func (cq *CollectionQuery) sqlCount(ctx context.Context) (int, error) {
	_spec := cq.querySpec()
	if len(cq.modifiers) > 0 {
		_spec.Modifiers = cq.modifiers
	}
	_spec.Node.Columns = cq.fields
	if len(cq.fields) > 0 {
		_spec.Unique = cq.unique != nil && *cq.unique
	}
	return sqlgraph.CountNodes(ctx, cq.driver, _spec)
}

func (cq *CollectionQuery) sqlExist(ctx context.Context) (bool, error) {
	n, err := cq.sqlCount(ctx)
	if err != nil {
		return false, fmt.Errorf("ent: check existence: %w", err)
	}
	return n > 0, nil
}

func (cq *CollectionQuery) querySpec() *sqlgraph.QuerySpec {
	_spec := &sqlgraph.QuerySpec{
		Node: &sqlgraph.NodeSpec{
			Table:   collection.Table,
			Columns: collection.Columns,
			ID: &sqlgraph.FieldSpec{
				Type:   field.TypeString,
				Column: collection.FieldID,
			},
		},
		From:   cq.sql,
		Unique: true,
	}
	if unique := cq.unique; unique != nil {
		_spec.Unique = *unique
	}
	if fields := cq.fields; len(fields) > 0 {
		_spec.Node.Columns = make([]string, 0, len(fields))
		_spec.Node.Columns = append(_spec.Node.Columns, collection.FieldID)
		for i := range fields {
			if fields[i] != collection.FieldID {
				_spec.Node.Columns = append(_spec.Node.Columns, fields[i])
			}
		}
	}
	if ps := cq.predicates; len(ps) > 0 {
		_spec.Predicate = func(selector *sql.Selector) {
			for i := range ps {
				ps[i](selector)
			}
		}
	}
	if limit := cq.limit; limit != nil {
		_spec.Limit = *limit
	}
	if offset := cq.offset; offset != nil {
		_spec.Offset = *offset
	}
	if ps := cq.order; len(ps) > 0 {
		_spec.Order = func(selector *sql.Selector) {
			for i := range ps {
				ps[i](selector)
			}
		}
	}
	return _spec
}

func (cq *CollectionQuery) sqlQuery(ctx context.Context) *sql.Selector {
	builder := sql.Dialect(cq.driver.Dialect())
	t1 := builder.Table(collection.Table)
	columns := cq.fields
	if len(columns) == 0 {
		columns = collection.Columns
	}
	selector := builder.Select(t1.Columns(columns...)...).From(t1)
	if cq.sql != nil {
		selector = cq.sql
		selector.Select(selector.Columns(columns...)...)
	}
	if cq.unique != nil && *cq.unique {
		selector.Distinct()
	}
	for _, p := range cq.predicates {
		p(selector)
	}
	for _, p := range cq.order {
		p(selector)
	}
	if offset := cq.offset; offset != nil {
		// limit is mandatory for offset clause. We start
		// with default value, and override it below if needed.
		selector.Offset(*offset).Limit(math.MaxInt32)
	}
	if limit := cq.limit; limit != nil {
		selector.Limit(*limit)
	}
	return selector
}

// CollectionGroupBy is the group-by builder for Collection entities.
type CollectionGroupBy struct {
	config
	selector
	fields []string
	fns    []AggregateFunc
	// intermediate query (i.e. traversal path).
	sql  *sql.Selector
	path func(context.Context) (*sql.Selector, error)
}

// Aggregate adds the given aggregation functions to the group-by query.
func (cgb *CollectionGroupBy) Aggregate(fns ...AggregateFunc) *CollectionGroupBy {
	cgb.fns = append(cgb.fns, fns...)
	return cgb
}

// Scan applies the group-by query and scans the result into the given value.
func (cgb *CollectionGroupBy) Scan(ctx context.Context, v interface{}) error {
	query, err := cgb.path(ctx)
	if err != nil {
		return err
	}
	cgb.sql = query
	return cgb.sqlScan(ctx, v)
}

func (cgb *CollectionGroupBy) sqlScan(ctx context.Context, v interface{}) error {
	for _, f := range cgb.fields {
		if !collection.ValidColumn(f) {
			return &ValidationError{Name: f, err: fmt.Errorf("invalid field %q for group-by", f)}
		}
	}
	selector := cgb.sqlQuery()
	if err := selector.Err(); err != nil {
		return err
	}
	rows := &sql.Rows{}
	query, args := selector.Query()
	if err := cgb.driver.Query(ctx, query, args, rows); err != nil {
		return err
	}
	defer rows.Close()
	return sql.ScanSlice(rows, v)
}

func (cgb *CollectionGroupBy) sqlQuery() *sql.Selector {
	selector := cgb.sql.Select()
	aggregation := make([]string, 0, len(cgb.fns))
	for _, fn := range cgb.fns {
		aggregation = append(aggregation, fn(selector))
	}
	// If no columns were selected in a custom aggregation function, the default
	// selection is the fields used for "group-by", and the aggregation functions.
	if len(selector.SelectedColumns()) == 0 {
		columns := make([]string, 0, len(cgb.fields)+len(cgb.fns))
		for _, f := range cgb.fields {
			columns = append(columns, selector.C(f))
		}
		columns = append(columns, aggregation...)
		selector.Select(columns...)
	}
	return selector.GroupBy(selector.Columns(cgb.fields...)...)
}

// CollectionSelect is the builder for selecting fields of Collection entities.
type CollectionSelect struct {
	*CollectionQuery
	selector
	// intermediate query (i.e. traversal path).
	sql *sql.Selector
}

// Scan applies the selector query and scans the result into the given value.
func (cs *CollectionSelect) Scan(ctx context.Context, v interface{}) error {
	if err := cs.prepareQuery(ctx); err != nil {
		return err
	}
	cs.sql = cs.CollectionQuery.sqlQuery(ctx)
	return cs.sqlScan(ctx, v)
}

func (cs *CollectionSelect) sqlScan(ctx context.Context, v interface{}) error {
	rows := &sql.Rows{}
	query, args := cs.sql.Query()
	if err := cs.driver.Query(ctx, query, args, rows); err != nil {
		return err
	}
	defer rows.Close()
	return sql.ScanSlice(rows, v)
}