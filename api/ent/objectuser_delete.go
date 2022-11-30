// Code generated by ent, DO NOT EDIT.

package ent

import (
	"context"
	"fmt"
	"radioatelier/ent/objectuser"
	"radioatelier/ent/predicate"

	"entgo.io/ent/dialect/sql"
	"entgo.io/ent/dialect/sql/sqlgraph"
)

// ObjectUserDelete is the builder for deleting a ObjectUser entity.
type ObjectUserDelete struct {
	config
	hooks    []Hook
	mutation *ObjectUserMutation
}

// Where appends a list predicates to the ObjectUserDelete builder.
func (oud *ObjectUserDelete) Where(ps ...predicate.ObjectUser) *ObjectUserDelete {
	oud.mutation.Where(ps...)
	return oud
}

// Exec executes the deletion query and returns how many vertices were deleted.
func (oud *ObjectUserDelete) Exec(ctx context.Context) (int, error) {
	var (
		err      error
		affected int
	)
	if len(oud.hooks) == 0 {
		affected, err = oud.sqlExec(ctx)
	} else {
		var mut Mutator = MutateFunc(func(ctx context.Context, m Mutation) (Value, error) {
			mutation, ok := m.(*ObjectUserMutation)
			if !ok {
				return nil, fmt.Errorf("unexpected mutation type %T", m)
			}
			oud.mutation = mutation
			affected, err = oud.sqlExec(ctx)
			mutation.done = true
			return affected, err
		})
		for i := len(oud.hooks) - 1; i >= 0; i-- {
			if oud.hooks[i] == nil {
				return 0, fmt.Errorf("ent: uninitialized hook (forgotten import ent/runtime?)")
			}
			mut = oud.hooks[i](mut)
		}
		if _, err := mut.Mutate(ctx, oud.mutation); err != nil {
			return 0, err
		}
	}
	return affected, err
}

// ExecX is like Exec, but panics if an error occurs.
func (oud *ObjectUserDelete) ExecX(ctx context.Context) int {
	n, err := oud.Exec(ctx)
	if err != nil {
		panic(err)
	}
	return n
}

func (oud *ObjectUserDelete) sqlExec(ctx context.Context) (int, error) {
	_spec := &sqlgraph.DeleteSpec{
		Node: &sqlgraph.NodeSpec{
			Table: objectuser.Table,
		},
	}
	if ps := oud.mutation.predicates; len(ps) > 0 {
		_spec.Predicate = func(selector *sql.Selector) {
			for i := range ps {
				ps[i](selector)
			}
		}
	}
	affected, err := sqlgraph.DeleteNodes(ctx, oud.driver, _spec)
	if err != nil && sqlgraph.IsConstraintError(err) {
		err = &ConstraintError{msg: err.Error(), wrap: err}
	}
	return affected, err
}

// ObjectUserDeleteOne is the builder for deleting a single ObjectUser entity.
type ObjectUserDeleteOne struct {
	oud *ObjectUserDelete
}

// Exec executes the deletion query.
func (oudo *ObjectUserDeleteOne) Exec(ctx context.Context) error {
	n, err := oudo.oud.Exec(ctx)
	switch {
	case err != nil:
		return err
	case n == 0:
		return &NotFoundError{objectuser.Label}
	default:
		return nil
	}
}

// ExecX is like Exec, but panics if an error occurs.
func (oudo *ObjectUserDeleteOne) ExecX(ctx context.Context) {
	oudo.oud.ExecX(ctx)
}