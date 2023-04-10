// Code generated by ent, DO NOT EDIT.

package ent

import (
	"context"
	"errors"
	"fmt"
	"radioatelier/ent/city"
	"radioatelier/ent/object"
	"radioatelier/ent/predicate"
	"radioatelier/ent/schema/puuid"

	"entgo.io/ent/dialect/sql"
	"entgo.io/ent/dialect/sql/sqlgraph"
	"entgo.io/ent/schema/field"
)

// CityUpdate is the builder for updating City entities.
type CityUpdate struct {
	config
	hooks    []Hook
	mutation *CityMutation
}

// Where appends a list predicates to the CityUpdate builder.
func (cu *CityUpdate) Where(ps ...predicate.City) *CityUpdate {
	cu.mutation.Where(ps...)
	return cu
}

// SetName sets the "name" field.
func (cu *CityUpdate) SetName(s string) *CityUpdate {
	cu.mutation.SetName(s)
	return cu
}

// SetCountry sets the "country" field.
func (cu *CityUpdate) SetCountry(s string) *CityUpdate {
	cu.mutation.SetCountry(s)
	return cu
}

// AddObjectIDs adds the "objects" edge to the Object entity by IDs.
func (cu *CityUpdate) AddObjectIDs(ids ...puuid.ID) *CityUpdate {
	cu.mutation.AddObjectIDs(ids...)
	return cu
}

// AddObjects adds the "objects" edges to the Object entity.
func (cu *CityUpdate) AddObjects(o ...*Object) *CityUpdate {
	ids := make([]puuid.ID, len(o))
	for i := range o {
		ids[i] = o[i].ID
	}
	return cu.AddObjectIDs(ids...)
}

// Mutation returns the CityMutation object of the builder.
func (cu *CityUpdate) Mutation() *CityMutation {
	return cu.mutation
}

// ClearObjects clears all "objects" edges to the Object entity.
func (cu *CityUpdate) ClearObjects() *CityUpdate {
	cu.mutation.ClearObjects()
	return cu
}

// RemoveObjectIDs removes the "objects" edge to Object entities by IDs.
func (cu *CityUpdate) RemoveObjectIDs(ids ...puuid.ID) *CityUpdate {
	cu.mutation.RemoveObjectIDs(ids...)
	return cu
}

// RemoveObjects removes "objects" edges to Object entities.
func (cu *CityUpdate) RemoveObjects(o ...*Object) *CityUpdate {
	ids := make([]puuid.ID, len(o))
	for i := range o {
		ids[i] = o[i].ID
	}
	return cu.RemoveObjectIDs(ids...)
}

// Save executes the query and returns the number of nodes affected by the update operation.
func (cu *CityUpdate) Save(ctx context.Context) (int, error) {
	return withHooks[int, CityMutation](ctx, cu.sqlSave, cu.mutation, cu.hooks)
}

// SaveX is like Save, but panics if an error occurs.
func (cu *CityUpdate) SaveX(ctx context.Context) int {
	affected, err := cu.Save(ctx)
	if err != nil {
		panic(err)
	}
	return affected
}

// Exec executes the query.
func (cu *CityUpdate) Exec(ctx context.Context) error {
	_, err := cu.Save(ctx)
	return err
}

// ExecX is like Exec, but panics if an error occurs.
func (cu *CityUpdate) ExecX(ctx context.Context) {
	if err := cu.Exec(ctx); err != nil {
		panic(err)
	}
}

func (cu *CityUpdate) sqlSave(ctx context.Context) (n int, err error) {
	_spec := sqlgraph.NewUpdateSpec(city.Table, city.Columns, sqlgraph.NewFieldSpec(city.FieldID, field.TypeString))
	if ps := cu.mutation.predicates; len(ps) > 0 {
		_spec.Predicate = func(selector *sql.Selector) {
			for i := range ps {
				ps[i](selector)
			}
		}
	}
	if value, ok := cu.mutation.Name(); ok {
		_spec.SetField(city.FieldName, field.TypeString, value)
	}
	if value, ok := cu.mutation.Country(); ok {
		_spec.SetField(city.FieldCountry, field.TypeString, value)
	}
	if cu.mutation.ObjectsCleared() {
		edge := &sqlgraph.EdgeSpec{
			Rel:     sqlgraph.O2M,
			Inverse: false,
			Table:   city.ObjectsTable,
			Columns: []string{city.ObjectsColumn},
			Bidi:    false,
			Target: &sqlgraph.EdgeTarget{
				IDSpec: sqlgraph.NewFieldSpec(object.FieldID, field.TypeString),
			},
		}
		_spec.Edges.Clear = append(_spec.Edges.Clear, edge)
	}
	if nodes := cu.mutation.RemovedObjectsIDs(); len(nodes) > 0 && !cu.mutation.ObjectsCleared() {
		edge := &sqlgraph.EdgeSpec{
			Rel:     sqlgraph.O2M,
			Inverse: false,
			Table:   city.ObjectsTable,
			Columns: []string{city.ObjectsColumn},
			Bidi:    false,
			Target: &sqlgraph.EdgeTarget{
				IDSpec: sqlgraph.NewFieldSpec(object.FieldID, field.TypeString),
			},
		}
		for _, k := range nodes {
			edge.Target.Nodes = append(edge.Target.Nodes, k)
		}
		_spec.Edges.Clear = append(_spec.Edges.Clear, edge)
	}
	if nodes := cu.mutation.ObjectsIDs(); len(nodes) > 0 {
		edge := &sqlgraph.EdgeSpec{
			Rel:     sqlgraph.O2M,
			Inverse: false,
			Table:   city.ObjectsTable,
			Columns: []string{city.ObjectsColumn},
			Bidi:    false,
			Target: &sqlgraph.EdgeTarget{
				IDSpec: sqlgraph.NewFieldSpec(object.FieldID, field.TypeString),
			},
		}
		for _, k := range nodes {
			edge.Target.Nodes = append(edge.Target.Nodes, k)
		}
		_spec.Edges.Add = append(_spec.Edges.Add, edge)
	}
	if n, err = sqlgraph.UpdateNodes(ctx, cu.driver, _spec); err != nil {
		if _, ok := err.(*sqlgraph.NotFoundError); ok {
			err = &NotFoundError{city.Label}
		} else if sqlgraph.IsConstraintError(err) {
			err = &ConstraintError{msg: err.Error(), wrap: err}
		}
		return 0, err
	}
	cu.mutation.done = true
	return n, nil
}

// CityUpdateOne is the builder for updating a single City entity.
type CityUpdateOne struct {
	config
	fields   []string
	hooks    []Hook
	mutation *CityMutation
}

// SetName sets the "name" field.
func (cuo *CityUpdateOne) SetName(s string) *CityUpdateOne {
	cuo.mutation.SetName(s)
	return cuo
}

// SetCountry sets the "country" field.
func (cuo *CityUpdateOne) SetCountry(s string) *CityUpdateOne {
	cuo.mutation.SetCountry(s)
	return cuo
}

// AddObjectIDs adds the "objects" edge to the Object entity by IDs.
func (cuo *CityUpdateOne) AddObjectIDs(ids ...puuid.ID) *CityUpdateOne {
	cuo.mutation.AddObjectIDs(ids...)
	return cuo
}

// AddObjects adds the "objects" edges to the Object entity.
func (cuo *CityUpdateOne) AddObjects(o ...*Object) *CityUpdateOne {
	ids := make([]puuid.ID, len(o))
	for i := range o {
		ids[i] = o[i].ID
	}
	return cuo.AddObjectIDs(ids...)
}

// Mutation returns the CityMutation object of the builder.
func (cuo *CityUpdateOne) Mutation() *CityMutation {
	return cuo.mutation
}

// ClearObjects clears all "objects" edges to the Object entity.
func (cuo *CityUpdateOne) ClearObjects() *CityUpdateOne {
	cuo.mutation.ClearObjects()
	return cuo
}

// RemoveObjectIDs removes the "objects" edge to Object entities by IDs.
func (cuo *CityUpdateOne) RemoveObjectIDs(ids ...puuid.ID) *CityUpdateOne {
	cuo.mutation.RemoveObjectIDs(ids...)
	return cuo
}

// RemoveObjects removes "objects" edges to Object entities.
func (cuo *CityUpdateOne) RemoveObjects(o ...*Object) *CityUpdateOne {
	ids := make([]puuid.ID, len(o))
	for i := range o {
		ids[i] = o[i].ID
	}
	return cuo.RemoveObjectIDs(ids...)
}

// Where appends a list predicates to the CityUpdate builder.
func (cuo *CityUpdateOne) Where(ps ...predicate.City) *CityUpdateOne {
	cuo.mutation.Where(ps...)
	return cuo
}

// Select allows selecting one or more fields (columns) of the returned entity.
// The default is selecting all fields defined in the entity schema.
func (cuo *CityUpdateOne) Select(field string, fields ...string) *CityUpdateOne {
	cuo.fields = append([]string{field}, fields...)
	return cuo
}

// Save executes the query and returns the updated City entity.
func (cuo *CityUpdateOne) Save(ctx context.Context) (*City, error) {
	return withHooks[*City, CityMutation](ctx, cuo.sqlSave, cuo.mutation, cuo.hooks)
}

// SaveX is like Save, but panics if an error occurs.
func (cuo *CityUpdateOne) SaveX(ctx context.Context) *City {
	node, err := cuo.Save(ctx)
	if err != nil {
		panic(err)
	}
	return node
}

// Exec executes the query on the entity.
func (cuo *CityUpdateOne) Exec(ctx context.Context) error {
	_, err := cuo.Save(ctx)
	return err
}

// ExecX is like Exec, but panics if an error occurs.
func (cuo *CityUpdateOne) ExecX(ctx context.Context) {
	if err := cuo.Exec(ctx); err != nil {
		panic(err)
	}
}

func (cuo *CityUpdateOne) sqlSave(ctx context.Context) (_node *City, err error) {
	_spec := sqlgraph.NewUpdateSpec(city.Table, city.Columns, sqlgraph.NewFieldSpec(city.FieldID, field.TypeString))
	id, ok := cuo.mutation.ID()
	if !ok {
		return nil, &ValidationError{Name: "id", err: errors.New(`ent: missing "City.id" for update`)}
	}
	_spec.Node.ID.Value = id
	if fields := cuo.fields; len(fields) > 0 {
		_spec.Node.Columns = make([]string, 0, len(fields))
		_spec.Node.Columns = append(_spec.Node.Columns, city.FieldID)
		for _, f := range fields {
			if !city.ValidColumn(f) {
				return nil, &ValidationError{Name: f, err: fmt.Errorf("ent: invalid field %q for query", f)}
			}
			if f != city.FieldID {
				_spec.Node.Columns = append(_spec.Node.Columns, f)
			}
		}
	}
	if ps := cuo.mutation.predicates; len(ps) > 0 {
		_spec.Predicate = func(selector *sql.Selector) {
			for i := range ps {
				ps[i](selector)
			}
		}
	}
	if value, ok := cuo.mutation.Name(); ok {
		_spec.SetField(city.FieldName, field.TypeString, value)
	}
	if value, ok := cuo.mutation.Country(); ok {
		_spec.SetField(city.FieldCountry, field.TypeString, value)
	}
	if cuo.mutation.ObjectsCleared() {
		edge := &sqlgraph.EdgeSpec{
			Rel:     sqlgraph.O2M,
			Inverse: false,
			Table:   city.ObjectsTable,
			Columns: []string{city.ObjectsColumn},
			Bidi:    false,
			Target: &sqlgraph.EdgeTarget{
				IDSpec: sqlgraph.NewFieldSpec(object.FieldID, field.TypeString),
			},
		}
		_spec.Edges.Clear = append(_spec.Edges.Clear, edge)
	}
	if nodes := cuo.mutation.RemovedObjectsIDs(); len(nodes) > 0 && !cuo.mutation.ObjectsCleared() {
		edge := &sqlgraph.EdgeSpec{
			Rel:     sqlgraph.O2M,
			Inverse: false,
			Table:   city.ObjectsTable,
			Columns: []string{city.ObjectsColumn},
			Bidi:    false,
			Target: &sqlgraph.EdgeTarget{
				IDSpec: sqlgraph.NewFieldSpec(object.FieldID, field.TypeString),
			},
		}
		for _, k := range nodes {
			edge.Target.Nodes = append(edge.Target.Nodes, k)
		}
		_spec.Edges.Clear = append(_spec.Edges.Clear, edge)
	}
	if nodes := cuo.mutation.ObjectsIDs(); len(nodes) > 0 {
		edge := &sqlgraph.EdgeSpec{
			Rel:     sqlgraph.O2M,
			Inverse: false,
			Table:   city.ObjectsTable,
			Columns: []string{city.ObjectsColumn},
			Bidi:    false,
			Target: &sqlgraph.EdgeTarget{
				IDSpec: sqlgraph.NewFieldSpec(object.FieldID, field.TypeString),
			},
		}
		for _, k := range nodes {
			edge.Target.Nodes = append(edge.Target.Nodes, k)
		}
		_spec.Edges.Add = append(_spec.Edges.Add, edge)
	}
	_node = &City{config: cuo.config}
	_spec.Assign = _node.assignValues
	_spec.ScanValues = _node.scanValues
	if err = sqlgraph.UpdateNode(ctx, cuo.driver, _spec); err != nil {
		if _, ok := err.(*sqlgraph.NotFoundError); ok {
			err = &NotFoundError{city.Label}
		} else if sqlgraph.IsConstraintError(err) {
			err = &ConstraintError{msg: err.Error(), wrap: err}
		}
		return nil, err
	}
	cuo.mutation.done = true
	return _node, nil
}
