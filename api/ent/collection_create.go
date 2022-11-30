// Code generated by ent, DO NOT EDIT.

package ent

import (
	"context"
	"errors"
	"fmt"
	"radioatelier/ent/collection"
	"radioatelier/ent/object"
	"radioatelier/ent/schema/puuid"
	"radioatelier/ent/user"
	"time"

	"entgo.io/ent/dialect"
	"entgo.io/ent/dialect/sql"
	"entgo.io/ent/dialect/sql/sqlgraph"
	"entgo.io/ent/schema/field"
)

// CollectionCreate is the builder for creating a Collection entity.
type CollectionCreate struct {
	config
	mutation *CollectionMutation
	hooks    []Hook
	conflict []sql.ConflictOption
}

// SetName sets the "name" field.
func (cc *CollectionCreate) SetName(s string) *CollectionCreate {
	cc.mutation.SetName(s)
	return cc
}

// SetDescription sets the "description" field.
func (cc *CollectionCreate) SetDescription(s string) *CollectionCreate {
	cc.mutation.SetDescription(s)
	return cc
}

// SetNillableDescription sets the "description" field if the given value is not nil.
func (cc *CollectionCreate) SetNillableDescription(s *string) *CollectionCreate {
	if s != nil {
		cc.SetDescription(*s)
	}
	return cc
}

// SetCreatedAt sets the "created_at" field.
func (cc *CollectionCreate) SetCreatedAt(t time.Time) *CollectionCreate {
	cc.mutation.SetCreatedAt(t)
	return cc
}

// SetNillableCreatedAt sets the "created_at" field if the given value is not nil.
func (cc *CollectionCreate) SetNillableCreatedAt(t *time.Time) *CollectionCreate {
	if t != nil {
		cc.SetCreatedAt(*t)
	}
	return cc
}

// SetUpdatedAt sets the "updated_at" field.
func (cc *CollectionCreate) SetUpdatedAt(t time.Time) *CollectionCreate {
	cc.mutation.SetUpdatedAt(t)
	return cc
}

// SetNillableUpdatedAt sets the "updated_at" field if the given value is not nil.
func (cc *CollectionCreate) SetNillableUpdatedAt(t *time.Time) *CollectionCreate {
	if t != nil {
		cc.SetUpdatedAt(*t)
	}
	return cc
}

// SetID sets the "id" field.
func (cc *CollectionCreate) SetID(pu puuid.ID) *CollectionCreate {
	cc.mutation.SetID(pu)
	return cc
}

// SetNillableID sets the "id" field if the given value is not nil.
func (cc *CollectionCreate) SetNillableID(pu *puuid.ID) *CollectionCreate {
	if pu != nil {
		cc.SetID(*pu)
	}
	return cc
}

// SetCreatedByID sets the "created_by" edge to the User entity by ID.
func (cc *CollectionCreate) SetCreatedByID(id puuid.ID) *CollectionCreate {
	cc.mutation.SetCreatedByID(id)
	return cc
}

// SetCreatedBy sets the "created_by" edge to the User entity.
func (cc *CollectionCreate) SetCreatedBy(u *User) *CollectionCreate {
	return cc.SetCreatedByID(u.ID)
}

// SetUpdatedByID sets the "updated_by" edge to the User entity by ID.
func (cc *CollectionCreate) SetUpdatedByID(id puuid.ID) *CollectionCreate {
	cc.mutation.SetUpdatedByID(id)
	return cc
}

// SetUpdatedBy sets the "updated_by" edge to the User entity.
func (cc *CollectionCreate) SetUpdatedBy(u *User) *CollectionCreate {
	return cc.SetUpdatedByID(u.ID)
}

// AddObjectIDs adds the "objects" edge to the Object entity by IDs.
func (cc *CollectionCreate) AddObjectIDs(ids ...puuid.ID) *CollectionCreate {
	cc.mutation.AddObjectIDs(ids...)
	return cc
}

// AddObjects adds the "objects" edges to the Object entity.
func (cc *CollectionCreate) AddObjects(o ...*Object) *CollectionCreate {
	ids := make([]puuid.ID, len(o))
	for i := range o {
		ids[i] = o[i].ID
	}
	return cc.AddObjectIDs(ids...)
}

// AddUserIDs adds the "users" edge to the User entity by IDs.
func (cc *CollectionCreate) AddUserIDs(ids ...puuid.ID) *CollectionCreate {
	cc.mutation.AddUserIDs(ids...)
	return cc
}

// AddUsers adds the "users" edges to the User entity.
func (cc *CollectionCreate) AddUsers(u ...*User) *CollectionCreate {
	ids := make([]puuid.ID, len(u))
	for i := range u {
		ids[i] = u[i].ID
	}
	return cc.AddUserIDs(ids...)
}

// Mutation returns the CollectionMutation object of the builder.
func (cc *CollectionCreate) Mutation() *CollectionMutation {
	return cc.mutation
}

// Save creates the Collection in the database.
func (cc *CollectionCreate) Save(ctx context.Context) (*Collection, error) {
	var (
		err  error
		node *Collection
	)
	cc.defaults()
	if len(cc.hooks) == 0 {
		if err = cc.check(); err != nil {
			return nil, err
		}
		node, err = cc.sqlSave(ctx)
	} else {
		var mut Mutator = MutateFunc(func(ctx context.Context, m Mutation) (Value, error) {
			mutation, ok := m.(*CollectionMutation)
			if !ok {
				return nil, fmt.Errorf("unexpected mutation type %T", m)
			}
			if err = cc.check(); err != nil {
				return nil, err
			}
			cc.mutation = mutation
			if node, err = cc.sqlSave(ctx); err != nil {
				return nil, err
			}
			mutation.id = &node.ID
			mutation.done = true
			return node, err
		})
		for i := len(cc.hooks) - 1; i >= 0; i-- {
			if cc.hooks[i] == nil {
				return nil, fmt.Errorf("ent: uninitialized hook (forgotten import ent/runtime?)")
			}
			mut = cc.hooks[i](mut)
		}
		v, err := mut.Mutate(ctx, cc.mutation)
		if err != nil {
			return nil, err
		}
		nv, ok := v.(*Collection)
		if !ok {
			return nil, fmt.Errorf("unexpected node type %T returned from CollectionMutation", v)
		}
		node = nv
	}
	return node, err
}

// SaveX calls Save and panics if Save returns an error.
func (cc *CollectionCreate) SaveX(ctx context.Context) *Collection {
	v, err := cc.Save(ctx)
	if err != nil {
		panic(err)
	}
	return v
}

// Exec executes the query.
func (cc *CollectionCreate) Exec(ctx context.Context) error {
	_, err := cc.Save(ctx)
	return err
}

// ExecX is like Exec, but panics if an error occurs.
func (cc *CollectionCreate) ExecX(ctx context.Context) {
	if err := cc.Exec(ctx); err != nil {
		panic(err)
	}
}

// defaults sets the default values of the builder before save.
func (cc *CollectionCreate) defaults() {
	if _, ok := cc.mutation.CreatedAt(); !ok {
		v := collection.DefaultCreatedAt()
		cc.mutation.SetCreatedAt(v)
	}
	if _, ok := cc.mutation.UpdatedAt(); !ok {
		v := collection.DefaultUpdatedAt()
		cc.mutation.SetUpdatedAt(v)
	}
	if _, ok := cc.mutation.ID(); !ok {
		v := collection.DefaultID()
		cc.mutation.SetID(v)
	}
}

// check runs all checks and user-defined validators on the builder.
func (cc *CollectionCreate) check() error {
	if _, ok := cc.mutation.Name(); !ok {
		return &ValidationError{Name: "name", err: errors.New(`ent: missing required field "Collection.name"`)}
	}
	if _, ok := cc.mutation.CreatedAt(); !ok {
		return &ValidationError{Name: "created_at", err: errors.New(`ent: missing required field "Collection.created_at"`)}
	}
	if _, ok := cc.mutation.UpdatedAt(); !ok {
		return &ValidationError{Name: "updated_at", err: errors.New(`ent: missing required field "Collection.updated_at"`)}
	}
	if _, ok := cc.mutation.CreatedByID(); !ok {
		return &ValidationError{Name: "created_by", err: errors.New(`ent: missing required edge "Collection.created_by"`)}
	}
	if _, ok := cc.mutation.UpdatedByID(); !ok {
		return &ValidationError{Name: "updated_by", err: errors.New(`ent: missing required edge "Collection.updated_by"`)}
	}
	return nil
}

func (cc *CollectionCreate) sqlSave(ctx context.Context) (*Collection, error) {
	_node, _spec := cc.createSpec()
	if err := sqlgraph.CreateNode(ctx, cc.driver, _spec); err != nil {
		if sqlgraph.IsConstraintError(err) {
			err = &ConstraintError{msg: err.Error(), wrap: err}
		}
		return nil, err
	}
	if _spec.ID.Value != nil {
		if id, ok := _spec.ID.Value.(*puuid.ID); ok {
			_node.ID = *id
		} else if err := _node.ID.Scan(_spec.ID.Value); err != nil {
			return nil, err
		}
	}
	return _node, nil
}

func (cc *CollectionCreate) createSpec() (*Collection, *sqlgraph.CreateSpec) {
	var (
		_node = &Collection{config: cc.config}
		_spec = &sqlgraph.CreateSpec{
			Table: collection.Table,
			ID: &sqlgraph.FieldSpec{
				Type:   field.TypeString,
				Column: collection.FieldID,
			},
		}
	)
	_spec.OnConflict = cc.conflict
	if id, ok := cc.mutation.ID(); ok {
		_node.ID = id
		_spec.ID.Value = &id
	}
	if value, ok := cc.mutation.Name(); ok {
		_spec.Fields = append(_spec.Fields, &sqlgraph.FieldSpec{
			Type:   field.TypeString,
			Value:  value,
			Column: collection.FieldName,
		})
		_node.Name = value
	}
	if value, ok := cc.mutation.Description(); ok {
		_spec.Fields = append(_spec.Fields, &sqlgraph.FieldSpec{
			Type:   field.TypeString,
			Value:  value,
			Column: collection.FieldDescription,
		})
		_node.Description = value
	}
	if value, ok := cc.mutation.CreatedAt(); ok {
		_spec.Fields = append(_spec.Fields, &sqlgraph.FieldSpec{
			Type:   field.TypeTime,
			Value:  value,
			Column: collection.FieldCreatedAt,
		})
		_node.CreatedAt = value
	}
	if value, ok := cc.mutation.UpdatedAt(); ok {
		_spec.Fields = append(_spec.Fields, &sqlgraph.FieldSpec{
			Type:   field.TypeTime,
			Value:  value,
			Column: collection.FieldUpdatedAt,
		})
		_node.UpdatedAt = value
	}
	if nodes := cc.mutation.CreatedByIDs(); len(nodes) > 0 {
		edge := &sqlgraph.EdgeSpec{
			Rel:     sqlgraph.M2O,
			Inverse: true,
			Table:   collection.CreatedByTable,
			Columns: []string{collection.CreatedByColumn},
			Bidi:    false,
			Target: &sqlgraph.EdgeTarget{
				IDSpec: &sqlgraph.FieldSpec{
					Type:   field.TypeString,
					Column: user.FieldID,
				},
			},
		}
		for _, k := range nodes {
			edge.Target.Nodes = append(edge.Target.Nodes, k)
		}
		_node.created_by = &nodes[0]
		_spec.Edges = append(_spec.Edges, edge)
	}
	if nodes := cc.mutation.UpdatedByIDs(); len(nodes) > 0 {
		edge := &sqlgraph.EdgeSpec{
			Rel:     sqlgraph.M2O,
			Inverse: true,
			Table:   collection.UpdatedByTable,
			Columns: []string{collection.UpdatedByColumn},
			Bidi:    false,
			Target: &sqlgraph.EdgeTarget{
				IDSpec: &sqlgraph.FieldSpec{
					Type:   field.TypeString,
					Column: user.FieldID,
				},
			},
		}
		for _, k := range nodes {
			edge.Target.Nodes = append(edge.Target.Nodes, k)
		}
		_node.updated_by = &nodes[0]
		_spec.Edges = append(_spec.Edges, edge)
	}
	if nodes := cc.mutation.ObjectsIDs(); len(nodes) > 0 {
		edge := &sqlgraph.EdgeSpec{
			Rel:     sqlgraph.M2M,
			Inverse: true,
			Table:   collection.ObjectsTable,
			Columns: collection.ObjectsPrimaryKey,
			Bidi:    false,
			Target: &sqlgraph.EdgeTarget{
				IDSpec: &sqlgraph.FieldSpec{
					Type:   field.TypeString,
					Column: object.FieldID,
				},
			},
		}
		for _, k := range nodes {
			edge.Target.Nodes = append(edge.Target.Nodes, k)
		}
		_spec.Edges = append(_spec.Edges, edge)
	}
	if nodes := cc.mutation.UsersIDs(); len(nodes) > 0 {
		edge := &sqlgraph.EdgeSpec{
			Rel:     sqlgraph.M2M,
			Inverse: true,
			Table:   collection.UsersTable,
			Columns: collection.UsersPrimaryKey,
			Bidi:    false,
			Target: &sqlgraph.EdgeTarget{
				IDSpec: &sqlgraph.FieldSpec{
					Type:   field.TypeString,
					Column: user.FieldID,
				},
			},
		}
		for _, k := range nodes {
			edge.Target.Nodes = append(edge.Target.Nodes, k)
		}
		_spec.Edges = append(_spec.Edges, edge)
	}
	return _node, _spec
}

// OnConflict allows configuring the `ON CONFLICT` / `ON DUPLICATE KEY` clause
// of the `INSERT` statement. For example:
//
//	client.Collection.Create().
//		SetName(v).
//		OnConflict(
//			// Update the row with the new values
//			// the was proposed for insertion.
//			sql.ResolveWithNewValues(),
//		).
//		// Override some of the fields with custom
//		// update values.
//		Update(func(u *ent.CollectionUpsert) {
//			SetName(v+v).
//		}).
//		Exec(ctx)
func (cc *CollectionCreate) OnConflict(opts ...sql.ConflictOption) *CollectionUpsertOne {
	cc.conflict = opts
	return &CollectionUpsertOne{
		create: cc,
	}
}

// OnConflictColumns calls `OnConflict` and configures the columns
// as conflict target. Using this option is equivalent to using:
//
//	client.Collection.Create().
//		OnConflict(sql.ConflictColumns(columns...)).
//		Exec(ctx)
func (cc *CollectionCreate) OnConflictColumns(columns ...string) *CollectionUpsertOne {
	cc.conflict = append(cc.conflict, sql.ConflictColumns(columns...))
	return &CollectionUpsertOne{
		create: cc,
	}
}

type (
	// CollectionUpsertOne is the builder for "upsert"-ing
	//  one Collection node.
	CollectionUpsertOne struct {
		create *CollectionCreate
	}

	// CollectionUpsert is the "OnConflict" setter.
	CollectionUpsert struct {
		*sql.UpdateSet
	}
)

// SetName sets the "name" field.
func (u *CollectionUpsert) SetName(v string) *CollectionUpsert {
	u.Set(collection.FieldName, v)
	return u
}

// UpdateName sets the "name" field to the value that was provided on create.
func (u *CollectionUpsert) UpdateName() *CollectionUpsert {
	u.SetExcluded(collection.FieldName)
	return u
}

// SetDescription sets the "description" field.
func (u *CollectionUpsert) SetDescription(v string) *CollectionUpsert {
	u.Set(collection.FieldDescription, v)
	return u
}

// UpdateDescription sets the "description" field to the value that was provided on create.
func (u *CollectionUpsert) UpdateDescription() *CollectionUpsert {
	u.SetExcluded(collection.FieldDescription)
	return u
}

// ClearDescription clears the value of the "description" field.
func (u *CollectionUpsert) ClearDescription() *CollectionUpsert {
	u.SetNull(collection.FieldDescription)
	return u
}

// SetCreatedAt sets the "created_at" field.
func (u *CollectionUpsert) SetCreatedAt(v time.Time) *CollectionUpsert {
	u.Set(collection.FieldCreatedAt, v)
	return u
}

// UpdateCreatedAt sets the "created_at" field to the value that was provided on create.
func (u *CollectionUpsert) UpdateCreatedAt() *CollectionUpsert {
	u.SetExcluded(collection.FieldCreatedAt)
	return u
}

// SetUpdatedAt sets the "updated_at" field.
func (u *CollectionUpsert) SetUpdatedAt(v time.Time) *CollectionUpsert {
	u.Set(collection.FieldUpdatedAt, v)
	return u
}

// UpdateUpdatedAt sets the "updated_at" field to the value that was provided on create.
func (u *CollectionUpsert) UpdateUpdatedAt() *CollectionUpsert {
	u.SetExcluded(collection.FieldUpdatedAt)
	return u
}

// UpdateNewValues updates the mutable fields using the new values that were set on create except the ID field.
// Using this option is equivalent to using:
//
//	client.Collection.Create().
//		OnConflict(
//			sql.ResolveWithNewValues(),
//			sql.ResolveWith(func(u *sql.UpdateSet) {
//				u.SetIgnore(collection.FieldID)
//			}),
//		).
//		Exec(ctx)
func (u *CollectionUpsertOne) UpdateNewValues() *CollectionUpsertOne {
	u.create.conflict = append(u.create.conflict, sql.ResolveWithNewValues())
	u.create.conflict = append(u.create.conflict, sql.ResolveWith(func(s *sql.UpdateSet) {
		if _, exists := u.create.mutation.ID(); exists {
			s.SetIgnore(collection.FieldID)
		}
		if _, exists := u.create.mutation.CreatedAt(); exists {
			s.SetIgnore(collection.FieldCreatedAt)
		}
	}))
	return u
}

// Ignore sets each column to itself in case of conflict.
// Using this option is equivalent to using:
//
//	client.Collection.Create().
//	    OnConflict(sql.ResolveWithIgnore()).
//	    Exec(ctx)
func (u *CollectionUpsertOne) Ignore() *CollectionUpsertOne {
	u.create.conflict = append(u.create.conflict, sql.ResolveWithIgnore())
	return u
}

// DoNothing configures the conflict_action to `DO NOTHING`.
// Supported only by SQLite and PostgreSQL.
func (u *CollectionUpsertOne) DoNothing() *CollectionUpsertOne {
	u.create.conflict = append(u.create.conflict, sql.DoNothing())
	return u
}

// Update allows overriding fields `UPDATE` values. See the CollectionCreate.OnConflict
// documentation for more info.
func (u *CollectionUpsertOne) Update(set func(*CollectionUpsert)) *CollectionUpsertOne {
	u.create.conflict = append(u.create.conflict, sql.ResolveWith(func(update *sql.UpdateSet) {
		set(&CollectionUpsert{UpdateSet: update})
	}))
	return u
}

// SetName sets the "name" field.
func (u *CollectionUpsertOne) SetName(v string) *CollectionUpsertOne {
	return u.Update(func(s *CollectionUpsert) {
		s.SetName(v)
	})
}

// UpdateName sets the "name" field to the value that was provided on create.
func (u *CollectionUpsertOne) UpdateName() *CollectionUpsertOne {
	return u.Update(func(s *CollectionUpsert) {
		s.UpdateName()
	})
}

// SetDescription sets the "description" field.
func (u *CollectionUpsertOne) SetDescription(v string) *CollectionUpsertOne {
	return u.Update(func(s *CollectionUpsert) {
		s.SetDescription(v)
	})
}

// UpdateDescription sets the "description" field to the value that was provided on create.
func (u *CollectionUpsertOne) UpdateDescription() *CollectionUpsertOne {
	return u.Update(func(s *CollectionUpsert) {
		s.UpdateDescription()
	})
}

// ClearDescription clears the value of the "description" field.
func (u *CollectionUpsertOne) ClearDescription() *CollectionUpsertOne {
	return u.Update(func(s *CollectionUpsert) {
		s.ClearDescription()
	})
}

// SetCreatedAt sets the "created_at" field.
func (u *CollectionUpsertOne) SetCreatedAt(v time.Time) *CollectionUpsertOne {
	return u.Update(func(s *CollectionUpsert) {
		s.SetCreatedAt(v)
	})
}

// UpdateCreatedAt sets the "created_at" field to the value that was provided on create.
func (u *CollectionUpsertOne) UpdateCreatedAt() *CollectionUpsertOne {
	return u.Update(func(s *CollectionUpsert) {
		s.UpdateCreatedAt()
	})
}

// SetUpdatedAt sets the "updated_at" field.
func (u *CollectionUpsertOne) SetUpdatedAt(v time.Time) *CollectionUpsertOne {
	return u.Update(func(s *CollectionUpsert) {
		s.SetUpdatedAt(v)
	})
}

// UpdateUpdatedAt sets the "updated_at" field to the value that was provided on create.
func (u *CollectionUpsertOne) UpdateUpdatedAt() *CollectionUpsertOne {
	return u.Update(func(s *CollectionUpsert) {
		s.UpdateUpdatedAt()
	})
}

// Exec executes the query.
func (u *CollectionUpsertOne) Exec(ctx context.Context) error {
	if len(u.create.conflict) == 0 {
		return errors.New("ent: missing options for CollectionCreate.OnConflict")
	}
	return u.create.Exec(ctx)
}

// ExecX is like Exec, but panics if an error occurs.
func (u *CollectionUpsertOne) ExecX(ctx context.Context) {
	if err := u.create.Exec(ctx); err != nil {
		panic(err)
	}
}

// Exec executes the UPSERT query and returns the inserted/updated ID.
func (u *CollectionUpsertOne) ID(ctx context.Context) (id puuid.ID, err error) {
	if u.create.driver.Dialect() == dialect.MySQL {
		// In case of "ON CONFLICT", there is no way to get back non-numeric ID
		// fields from the database since MySQL does not support the RETURNING clause.
		return id, errors.New("ent: CollectionUpsertOne.ID is not supported by MySQL driver. Use CollectionUpsertOne.Exec instead")
	}
	node, err := u.create.Save(ctx)
	if err != nil {
		return id, err
	}
	return node.ID, nil
}

// IDX is like ID, but panics if an error occurs.
func (u *CollectionUpsertOne) IDX(ctx context.Context) puuid.ID {
	id, err := u.ID(ctx)
	if err != nil {
		panic(err)
	}
	return id
}

// CollectionCreateBulk is the builder for creating many Collection entities in bulk.
type CollectionCreateBulk struct {
	config
	builders []*CollectionCreate
	conflict []sql.ConflictOption
}

// Save creates the Collection entities in the database.
func (ccb *CollectionCreateBulk) Save(ctx context.Context) ([]*Collection, error) {
	specs := make([]*sqlgraph.CreateSpec, len(ccb.builders))
	nodes := make([]*Collection, len(ccb.builders))
	mutators := make([]Mutator, len(ccb.builders))
	for i := range ccb.builders {
		func(i int, root context.Context) {
			builder := ccb.builders[i]
			builder.defaults()
			var mut Mutator = MutateFunc(func(ctx context.Context, m Mutation) (Value, error) {
				mutation, ok := m.(*CollectionMutation)
				if !ok {
					return nil, fmt.Errorf("unexpected mutation type %T", m)
				}
				if err := builder.check(); err != nil {
					return nil, err
				}
				builder.mutation = mutation
				nodes[i], specs[i] = builder.createSpec()
				var err error
				if i < len(mutators)-1 {
					_, err = mutators[i+1].Mutate(root, ccb.builders[i+1].mutation)
				} else {
					spec := &sqlgraph.BatchCreateSpec{Nodes: specs}
					spec.OnConflict = ccb.conflict
					// Invoke the actual operation on the latest mutation in the chain.
					if err = sqlgraph.BatchCreate(ctx, ccb.driver, spec); err != nil {
						if sqlgraph.IsConstraintError(err) {
							err = &ConstraintError{msg: err.Error(), wrap: err}
						}
					}
				}
				if err != nil {
					return nil, err
				}
				mutation.id = &nodes[i].ID
				mutation.done = true
				return nodes[i], nil
			})
			for i := len(builder.hooks) - 1; i >= 0; i-- {
				mut = builder.hooks[i](mut)
			}
			mutators[i] = mut
		}(i, ctx)
	}
	if len(mutators) > 0 {
		if _, err := mutators[0].Mutate(ctx, ccb.builders[0].mutation); err != nil {
			return nil, err
		}
	}
	return nodes, nil
}

// SaveX is like Save, but panics if an error occurs.
func (ccb *CollectionCreateBulk) SaveX(ctx context.Context) []*Collection {
	v, err := ccb.Save(ctx)
	if err != nil {
		panic(err)
	}
	return v
}

// Exec executes the query.
func (ccb *CollectionCreateBulk) Exec(ctx context.Context) error {
	_, err := ccb.Save(ctx)
	return err
}

// ExecX is like Exec, but panics if an error occurs.
func (ccb *CollectionCreateBulk) ExecX(ctx context.Context) {
	if err := ccb.Exec(ctx); err != nil {
		panic(err)
	}
}

// OnConflict allows configuring the `ON CONFLICT` / `ON DUPLICATE KEY` clause
// of the `INSERT` statement. For example:
//
//	client.Collection.CreateBulk(builders...).
//		OnConflict(
//			// Update the row with the new values
//			// the was proposed for insertion.
//			sql.ResolveWithNewValues(),
//		).
//		// Override some of the fields with custom
//		// update values.
//		Update(func(u *ent.CollectionUpsert) {
//			SetName(v+v).
//		}).
//		Exec(ctx)
func (ccb *CollectionCreateBulk) OnConflict(opts ...sql.ConflictOption) *CollectionUpsertBulk {
	ccb.conflict = opts
	return &CollectionUpsertBulk{
		create: ccb,
	}
}

// OnConflictColumns calls `OnConflict` and configures the columns
// as conflict target. Using this option is equivalent to using:
//
//	client.Collection.Create().
//		OnConflict(sql.ConflictColumns(columns...)).
//		Exec(ctx)
func (ccb *CollectionCreateBulk) OnConflictColumns(columns ...string) *CollectionUpsertBulk {
	ccb.conflict = append(ccb.conflict, sql.ConflictColumns(columns...))
	return &CollectionUpsertBulk{
		create: ccb,
	}
}

// CollectionUpsertBulk is the builder for "upsert"-ing
// a bulk of Collection nodes.
type CollectionUpsertBulk struct {
	create *CollectionCreateBulk
}

// UpdateNewValues updates the mutable fields using the new values that
// were set on create. Using this option is equivalent to using:
//
//	client.Collection.Create().
//		OnConflict(
//			sql.ResolveWithNewValues(),
//			sql.ResolveWith(func(u *sql.UpdateSet) {
//				u.SetIgnore(collection.FieldID)
//			}),
//		).
//		Exec(ctx)
func (u *CollectionUpsertBulk) UpdateNewValues() *CollectionUpsertBulk {
	u.create.conflict = append(u.create.conflict, sql.ResolveWithNewValues())
	u.create.conflict = append(u.create.conflict, sql.ResolveWith(func(s *sql.UpdateSet) {
		for _, b := range u.create.builders {
			if _, exists := b.mutation.ID(); exists {
				s.SetIgnore(collection.FieldID)
				return
			}
			if _, exists := b.mutation.CreatedAt(); exists {
				s.SetIgnore(collection.FieldCreatedAt)
			}
		}
	}))
	return u
}

// Ignore sets each column to itself in case of conflict.
// Using this option is equivalent to using:
//
//	client.Collection.Create().
//		OnConflict(sql.ResolveWithIgnore()).
//		Exec(ctx)
func (u *CollectionUpsertBulk) Ignore() *CollectionUpsertBulk {
	u.create.conflict = append(u.create.conflict, sql.ResolveWithIgnore())
	return u
}

// DoNothing configures the conflict_action to `DO NOTHING`.
// Supported only by SQLite and PostgreSQL.
func (u *CollectionUpsertBulk) DoNothing() *CollectionUpsertBulk {
	u.create.conflict = append(u.create.conflict, sql.DoNothing())
	return u
}

// Update allows overriding fields `UPDATE` values. See the CollectionCreateBulk.OnConflict
// documentation for more info.
func (u *CollectionUpsertBulk) Update(set func(*CollectionUpsert)) *CollectionUpsertBulk {
	u.create.conflict = append(u.create.conflict, sql.ResolveWith(func(update *sql.UpdateSet) {
		set(&CollectionUpsert{UpdateSet: update})
	}))
	return u
}

// SetName sets the "name" field.
func (u *CollectionUpsertBulk) SetName(v string) *CollectionUpsertBulk {
	return u.Update(func(s *CollectionUpsert) {
		s.SetName(v)
	})
}

// UpdateName sets the "name" field to the value that was provided on create.
func (u *CollectionUpsertBulk) UpdateName() *CollectionUpsertBulk {
	return u.Update(func(s *CollectionUpsert) {
		s.UpdateName()
	})
}

// SetDescription sets the "description" field.
func (u *CollectionUpsertBulk) SetDescription(v string) *CollectionUpsertBulk {
	return u.Update(func(s *CollectionUpsert) {
		s.SetDescription(v)
	})
}

// UpdateDescription sets the "description" field to the value that was provided on create.
func (u *CollectionUpsertBulk) UpdateDescription() *CollectionUpsertBulk {
	return u.Update(func(s *CollectionUpsert) {
		s.UpdateDescription()
	})
}

// ClearDescription clears the value of the "description" field.
func (u *CollectionUpsertBulk) ClearDescription() *CollectionUpsertBulk {
	return u.Update(func(s *CollectionUpsert) {
		s.ClearDescription()
	})
}

// SetCreatedAt sets the "created_at" field.
func (u *CollectionUpsertBulk) SetCreatedAt(v time.Time) *CollectionUpsertBulk {
	return u.Update(func(s *CollectionUpsert) {
		s.SetCreatedAt(v)
	})
}

// UpdateCreatedAt sets the "created_at" field to the value that was provided on create.
func (u *CollectionUpsertBulk) UpdateCreatedAt() *CollectionUpsertBulk {
	return u.Update(func(s *CollectionUpsert) {
		s.UpdateCreatedAt()
	})
}

// SetUpdatedAt sets the "updated_at" field.
func (u *CollectionUpsertBulk) SetUpdatedAt(v time.Time) *CollectionUpsertBulk {
	return u.Update(func(s *CollectionUpsert) {
		s.SetUpdatedAt(v)
	})
}

// UpdateUpdatedAt sets the "updated_at" field to the value that was provided on create.
func (u *CollectionUpsertBulk) UpdateUpdatedAt() *CollectionUpsertBulk {
	return u.Update(func(s *CollectionUpsert) {
		s.UpdateUpdatedAt()
	})
}

// Exec executes the query.
func (u *CollectionUpsertBulk) Exec(ctx context.Context) error {
	for i, b := range u.create.builders {
		if len(b.conflict) != 0 {
			return fmt.Errorf("ent: OnConflict was set for builder %d. Set it on the CollectionCreateBulk instead", i)
		}
	}
	if len(u.create.conflict) == 0 {
		return errors.New("ent: missing options for CollectionCreateBulk.OnConflict")
	}
	return u.create.Exec(ctx)
}

// ExecX is like Exec, but panics if an error occurs.
func (u *CollectionUpsertBulk) ExecX(ctx context.Context) {
	if err := u.create.Exec(ctx); err != nil {
		panic(err)
	}
}