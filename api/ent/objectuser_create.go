// Code generated by ent, DO NOT EDIT.

package ent

import (
	"context"
	"errors"
	"fmt"
	"radioatelier/ent/object"
	"radioatelier/ent/objectuser"
	"radioatelier/ent/schema/puuid"
	"radioatelier/ent/user"
	"time"

	"entgo.io/ent/dialect/sql/sqlgraph"
	"entgo.io/ent/schema/field"
)

// ObjectUserCreate is the builder for creating a ObjectUser entity.
type ObjectUserCreate struct {
	config
	mutation *ObjectUserMutation
	hooks    []Hook
}

// SetUserID sets the "user_id" field.
func (ouc *ObjectUserCreate) SetUserID(pu puuid.ID) *ObjectUserCreate {
	ouc.mutation.SetUserID(pu)
	return ouc
}

// SetObjectID sets the "object_id" field.
func (ouc *ObjectUserCreate) SetObjectID(pu puuid.ID) *ObjectUserCreate {
	ouc.mutation.SetObjectID(pu)
	return ouc
}

// SetIsVisited sets the "is_visited" field.
func (ouc *ObjectUserCreate) SetIsVisited(b bool) *ObjectUserCreate {
	ouc.mutation.SetIsVisited(b)
	return ouc
}

// SetNillableIsVisited sets the "is_visited" field if the given value is not nil.
func (ouc *ObjectUserCreate) SetNillableIsVisited(b *bool) *ObjectUserCreate {
	if b != nil {
		ouc.SetIsVisited(*b)
	}
	return ouc
}

// SetLastVisit sets the "last_visit" field.
func (ouc *ObjectUserCreate) SetLastVisit(t time.Time) *ObjectUserCreate {
	ouc.mutation.SetLastVisit(t)
	return ouc
}

// SetNillableLastVisit sets the "last_visit" field if the given value is not nil.
func (ouc *ObjectUserCreate) SetNillableLastVisit(t *time.Time) *ObjectUserCreate {
	if t != nil {
		ouc.SetLastVisit(*t)
	}
	return ouc
}

// SetUser sets the "user" edge to the User entity.
func (ouc *ObjectUserCreate) SetUser(u *User) *ObjectUserCreate {
	return ouc.SetUserID(u.ID)
}

// SetObject sets the "object" edge to the Object entity.
func (ouc *ObjectUserCreate) SetObject(o *Object) *ObjectUserCreate {
	return ouc.SetObjectID(o.ID)
}

// Mutation returns the ObjectUserMutation object of the builder.
func (ouc *ObjectUserCreate) Mutation() *ObjectUserMutation {
	return ouc.mutation
}

// Save creates the ObjectUser in the database.
func (ouc *ObjectUserCreate) Save(ctx context.Context) (*ObjectUser, error) {
	var (
		err  error
		node *ObjectUser
	)
	ouc.defaults()
	if len(ouc.hooks) == 0 {
		if err = ouc.check(); err != nil {
			return nil, err
		}
		node, err = ouc.sqlSave(ctx)
	} else {
		var mut Mutator = MutateFunc(func(ctx context.Context, m Mutation) (Value, error) {
			mutation, ok := m.(*ObjectUserMutation)
			if !ok {
				return nil, fmt.Errorf("unexpected mutation type %T", m)
			}
			if err = ouc.check(); err != nil {
				return nil, err
			}
			ouc.mutation = mutation
			if node, err = ouc.sqlSave(ctx); err != nil {
				return nil, err
			}
			return node, err
		})
		for i := len(ouc.hooks) - 1; i >= 0; i-- {
			if ouc.hooks[i] == nil {
				return nil, fmt.Errorf("ent: uninitialized hook (forgotten import ent/runtime?)")
			}
			mut = ouc.hooks[i](mut)
		}
		v, err := mut.Mutate(ctx, ouc.mutation)
		if err != nil {
			return nil, err
		}
		nv, ok := v.(*ObjectUser)
		if !ok {
			return nil, fmt.Errorf("unexpected node type %T returned from ObjectUserMutation", v)
		}
		node = nv
	}
	return node, err
}

// SaveX calls Save and panics if Save returns an error.
func (ouc *ObjectUserCreate) SaveX(ctx context.Context) *ObjectUser {
	v, err := ouc.Save(ctx)
	if err != nil {
		panic(err)
	}
	return v
}

// Exec executes the query.
func (ouc *ObjectUserCreate) Exec(ctx context.Context) error {
	_, err := ouc.Save(ctx)
	return err
}

// ExecX is like Exec, but panics if an error occurs.
func (ouc *ObjectUserCreate) ExecX(ctx context.Context) {
	if err := ouc.Exec(ctx); err != nil {
		panic(err)
	}
}

// defaults sets the default values of the builder before save.
func (ouc *ObjectUserCreate) defaults() {
	if _, ok := ouc.mutation.IsVisited(); !ok {
		v := objectuser.DefaultIsVisited
		ouc.mutation.SetIsVisited(v)
	}
}

// check runs all checks and user-defined validators on the builder.
func (ouc *ObjectUserCreate) check() error {
	if _, ok := ouc.mutation.UserID(); !ok {
		return &ValidationError{Name: "user_id", err: errors.New(`ent: missing required field "ObjectUser.user_id"`)}
	}
	if _, ok := ouc.mutation.ObjectID(); !ok {
		return &ValidationError{Name: "object_id", err: errors.New(`ent: missing required field "ObjectUser.object_id"`)}
	}
	if _, ok := ouc.mutation.IsVisited(); !ok {
		return &ValidationError{Name: "is_visited", err: errors.New(`ent: missing required field "ObjectUser.is_visited"`)}
	}
	if _, ok := ouc.mutation.UserID(); !ok {
		return &ValidationError{Name: "user", err: errors.New(`ent: missing required edge "ObjectUser.user"`)}
	}
	if _, ok := ouc.mutation.ObjectID(); !ok {
		return &ValidationError{Name: "object", err: errors.New(`ent: missing required edge "ObjectUser.object"`)}
	}
	return nil
}

func (ouc *ObjectUserCreate) sqlSave(ctx context.Context) (*ObjectUser, error) {
	_node, _spec := ouc.createSpec()
	if err := sqlgraph.CreateNode(ctx, ouc.driver, _spec); err != nil {
		if sqlgraph.IsConstraintError(err) {
			err = &ConstraintError{msg: err.Error(), wrap: err}
		}
		return nil, err
	}
	return _node, nil
}

func (ouc *ObjectUserCreate) createSpec() (*ObjectUser, *sqlgraph.CreateSpec) {
	var (
		_node = &ObjectUser{config: ouc.config}
		_spec = &sqlgraph.CreateSpec{
			Table: objectuser.Table,
		}
	)
	if value, ok := ouc.mutation.IsVisited(); ok {
		_spec.Fields = append(_spec.Fields, &sqlgraph.FieldSpec{
			Type:   field.TypeBool,
			Value:  value,
			Column: objectuser.FieldIsVisited,
		})
		_node.IsVisited = value
	}
	if value, ok := ouc.mutation.LastVisit(); ok {
		_spec.Fields = append(_spec.Fields, &sqlgraph.FieldSpec{
			Type:   field.TypeTime,
			Value:  value,
			Column: objectuser.FieldLastVisit,
		})
		_node.LastVisit = &value
	}
	if nodes := ouc.mutation.UserIDs(); len(nodes) > 0 {
		edge := &sqlgraph.EdgeSpec{
			Rel:     sqlgraph.M2O,
			Inverse: false,
			Table:   objectuser.UserTable,
			Columns: []string{objectuser.UserColumn},
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
		_node.UserID = nodes[0]
		_spec.Edges = append(_spec.Edges, edge)
	}
	if nodes := ouc.mutation.ObjectIDs(); len(nodes) > 0 {
		edge := &sqlgraph.EdgeSpec{
			Rel:     sqlgraph.M2O,
			Inverse: false,
			Table:   objectuser.ObjectTable,
			Columns: []string{objectuser.ObjectColumn},
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
		_node.ObjectID = nodes[0]
		_spec.Edges = append(_spec.Edges, edge)
	}
	return _node, _spec
}

// ObjectUserCreateBulk is the builder for creating many ObjectUser entities in bulk.
type ObjectUserCreateBulk struct {
	config
	builders []*ObjectUserCreate
}

// Save creates the ObjectUser entities in the database.
func (oucb *ObjectUserCreateBulk) Save(ctx context.Context) ([]*ObjectUser, error) {
	specs := make([]*sqlgraph.CreateSpec, len(oucb.builders))
	nodes := make([]*ObjectUser, len(oucb.builders))
	mutators := make([]Mutator, len(oucb.builders))
	for i := range oucb.builders {
		func(i int, root context.Context) {
			builder := oucb.builders[i]
			builder.defaults()
			var mut Mutator = MutateFunc(func(ctx context.Context, m Mutation) (Value, error) {
				mutation, ok := m.(*ObjectUserMutation)
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
					_, err = mutators[i+1].Mutate(root, oucb.builders[i+1].mutation)
				} else {
					spec := &sqlgraph.BatchCreateSpec{Nodes: specs}
					// Invoke the actual operation on the latest mutation in the chain.
					if err = sqlgraph.BatchCreate(ctx, oucb.driver, spec); err != nil {
						if sqlgraph.IsConstraintError(err) {
							err = &ConstraintError{msg: err.Error(), wrap: err}
						}
					}
				}
				if err != nil {
					return nil, err
				}
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
		if _, err := mutators[0].Mutate(ctx, oucb.builders[0].mutation); err != nil {
			return nil, err
		}
	}
	return nodes, nil
}

// SaveX is like Save, but panics if an error occurs.
func (oucb *ObjectUserCreateBulk) SaveX(ctx context.Context) []*ObjectUser {
	v, err := oucb.Save(ctx)
	if err != nil {
		panic(err)
	}
	return v
}

// Exec executes the query.
func (oucb *ObjectUserCreateBulk) Exec(ctx context.Context) error {
	_, err := oucb.Save(ctx)
	return err
}

// ExecX is like Exec, but panics if an error occurs.
func (oucb *ObjectUserCreateBulk) ExecX(ctx context.Context) {
	if err := oucb.Exec(ctx); err != nil {
		panic(err)
	}
}
