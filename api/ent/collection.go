// Code generated by ent, DO NOT EDIT.

package ent

import (
	"fmt"
	"radioatelier/ent/collection"
	"radioatelier/ent/schema/puuid"
	"radioatelier/ent/user"
	"strings"
	"time"

	"entgo.io/ent/dialect/sql"
)

// Collection is the model entity for the Collection schema.
type Collection struct {
	config `json:"-"`
	// ID of the ent.
	ID puuid.ID `json:"id,omitempty"`
	// Name holds the value of the "name" field.
	Name string `json:"name,omitempty"`
	// Description holds the value of the "description" field.
	Description string `json:"description,omitempty"`
	// CreatedAt holds the value of the "created_at" field.
	CreatedAt time.Time `json:"created_at,omitempty"`
	// UpdatedAt holds the value of the "updated_at" field.
	UpdatedAt time.Time `json:"updated_at,omitempty"`
	// Edges holds the relations/edges for other nodes in the graph.
	// The values are being populated by the CollectionQuery when eager-loading is set.
	Edges      CollectionEdges `json:"edges"`
	created_by *puuid.ID
	updated_by *puuid.ID
}

// CollectionEdges holds the relations/edges for other nodes in the graph.
type CollectionEdges struct {
	// CreatedBy holds the value of the created_by edge.
	CreatedBy *User `json:"created_by,omitempty"`
	// UpdatedBy holds the value of the updated_by edge.
	UpdatedBy *User `json:"updated_by,omitempty"`
	// Objects holds the value of the objects edge.
	Objects []*Object `json:"objects,omitempty"`
	// Users holds the value of the users edge.
	Users []*User `json:"users,omitempty"`
	// loadedTypes holds the information for reporting if a
	// type was loaded (or requested) in eager-loading or not.
	loadedTypes [4]bool
	// totalCount holds the count of the edges above.
	totalCount [4]map[string]int

	namedObjects map[string][]*Object
	namedUsers   map[string][]*User
}

// CreatedByOrErr returns the CreatedBy value or an error if the edge
// was not loaded in eager-loading, or loaded but was not found.
func (e CollectionEdges) CreatedByOrErr() (*User, error) {
	if e.loadedTypes[0] {
		if e.CreatedBy == nil {
			// Edge was loaded but was not found.
			return nil, &NotFoundError{label: user.Label}
		}
		return e.CreatedBy, nil
	}
	return nil, &NotLoadedError{edge: "created_by"}
}

// UpdatedByOrErr returns the UpdatedBy value or an error if the edge
// was not loaded in eager-loading, or loaded but was not found.
func (e CollectionEdges) UpdatedByOrErr() (*User, error) {
	if e.loadedTypes[1] {
		if e.UpdatedBy == nil {
			// Edge was loaded but was not found.
			return nil, &NotFoundError{label: user.Label}
		}
		return e.UpdatedBy, nil
	}
	return nil, &NotLoadedError{edge: "updated_by"}
}

// ObjectsOrErr returns the Objects value or an error if the edge
// was not loaded in eager-loading.
func (e CollectionEdges) ObjectsOrErr() ([]*Object, error) {
	if e.loadedTypes[2] {
		return e.Objects, nil
	}
	return nil, &NotLoadedError{edge: "objects"}
}

// UsersOrErr returns the Users value or an error if the edge
// was not loaded in eager-loading.
func (e CollectionEdges) UsersOrErr() ([]*User, error) {
	if e.loadedTypes[3] {
		return e.Users, nil
	}
	return nil, &NotLoadedError{edge: "users"}
}

// scanValues returns the types for scanning values from sql.Rows.
func (*Collection) scanValues(columns []string) ([]any, error) {
	values := make([]any, len(columns))
	for i := range columns {
		switch columns[i] {
		case collection.FieldID:
			values[i] = new(puuid.ID)
		case collection.FieldName, collection.FieldDescription:
			values[i] = new(sql.NullString)
		case collection.FieldCreatedAt, collection.FieldUpdatedAt:
			values[i] = new(sql.NullTime)
		case collection.ForeignKeys[0]: // created_by
			values[i] = &sql.NullScanner{S: new(puuid.ID)}
		case collection.ForeignKeys[1]: // updated_by
			values[i] = &sql.NullScanner{S: new(puuid.ID)}
		default:
			return nil, fmt.Errorf("unexpected column %q for type Collection", columns[i])
		}
	}
	return values, nil
}

// assignValues assigns the values that were returned from sql.Rows (after scanning)
// to the Collection fields.
func (c *Collection) assignValues(columns []string, values []any) error {
	if m, n := len(values), len(columns); m < n {
		return fmt.Errorf("mismatch number of scan values: %d != %d", m, n)
	}
	for i := range columns {
		switch columns[i] {
		case collection.FieldID:
			if value, ok := values[i].(*puuid.ID); !ok {
				return fmt.Errorf("unexpected type %T for field id", values[i])
			} else if value != nil {
				c.ID = *value
			}
		case collection.FieldName:
			if value, ok := values[i].(*sql.NullString); !ok {
				return fmt.Errorf("unexpected type %T for field name", values[i])
			} else if value.Valid {
				c.Name = value.String
			}
		case collection.FieldDescription:
			if value, ok := values[i].(*sql.NullString); !ok {
				return fmt.Errorf("unexpected type %T for field description", values[i])
			} else if value.Valid {
				c.Description = value.String
			}
		case collection.FieldCreatedAt:
			if value, ok := values[i].(*sql.NullTime); !ok {
				return fmt.Errorf("unexpected type %T for field created_at", values[i])
			} else if value.Valid {
				c.CreatedAt = value.Time
			}
		case collection.FieldUpdatedAt:
			if value, ok := values[i].(*sql.NullTime); !ok {
				return fmt.Errorf("unexpected type %T for field updated_at", values[i])
			} else if value.Valid {
				c.UpdatedAt = value.Time
			}
		case collection.ForeignKeys[0]:
			if value, ok := values[i].(*sql.NullScanner); !ok {
				return fmt.Errorf("unexpected type %T for field created_by", values[i])
			} else if value.Valid {
				c.created_by = new(puuid.ID)
				*c.created_by = *value.S.(*puuid.ID)
			}
		case collection.ForeignKeys[1]:
			if value, ok := values[i].(*sql.NullScanner); !ok {
				return fmt.Errorf("unexpected type %T for field updated_by", values[i])
			} else if value.Valid {
				c.updated_by = new(puuid.ID)
				*c.updated_by = *value.S.(*puuid.ID)
			}
		}
	}
	return nil
}

// QueryCreatedBy queries the "created_by" edge of the Collection entity.
func (c *Collection) QueryCreatedBy() *UserQuery {
	return NewCollectionClient(c.config).QueryCreatedBy(c)
}

// QueryUpdatedBy queries the "updated_by" edge of the Collection entity.
func (c *Collection) QueryUpdatedBy() *UserQuery {
	return NewCollectionClient(c.config).QueryUpdatedBy(c)
}

// QueryObjects queries the "objects" edge of the Collection entity.
func (c *Collection) QueryObjects() *ObjectQuery {
	return NewCollectionClient(c.config).QueryObjects(c)
}

// QueryUsers queries the "users" edge of the Collection entity.
func (c *Collection) QueryUsers() *UserQuery {
	return NewCollectionClient(c.config).QueryUsers(c)
}

// Update returns a builder for updating this Collection.
// Note that you need to call Collection.Unwrap() before calling this method if this Collection
// was returned from a transaction, and the transaction was committed or rolled back.
func (c *Collection) Update() *CollectionUpdateOne {
	return NewCollectionClient(c.config).UpdateOne(c)
}

// Unwrap unwraps the Collection entity that was returned from a transaction after it was closed,
// so that all future queries will be executed through the driver which created the transaction.
func (c *Collection) Unwrap() *Collection {
	_tx, ok := c.config.driver.(*txDriver)
	if !ok {
		panic("ent: Collection is not a transactional entity")
	}
	c.config.driver = _tx.drv
	return c
}

// String implements the fmt.Stringer.
func (c *Collection) String() string {
	var builder strings.Builder
	builder.WriteString("Collection(")
	builder.WriteString(fmt.Sprintf("id=%v, ", c.ID))
	builder.WriteString("name=")
	builder.WriteString(c.Name)
	builder.WriteString(", ")
	builder.WriteString("description=")
	builder.WriteString(c.Description)
	builder.WriteString(", ")
	builder.WriteString("created_at=")
	builder.WriteString(c.CreatedAt.Format(time.ANSIC))
	builder.WriteString(", ")
	builder.WriteString("updated_at=")
	builder.WriteString(c.UpdatedAt.Format(time.ANSIC))
	builder.WriteByte(')')
	return builder.String()
}

// NamedObjects returns the Objects named value or an error if the edge was not
// loaded in eager-loading with this name.
func (c *Collection) NamedObjects(name string) ([]*Object, error) {
	if c.Edges.namedObjects == nil {
		return nil, &NotLoadedError{edge: name}
	}
	nodes, ok := c.Edges.namedObjects[name]
	if !ok {
		return nil, &NotLoadedError{edge: name}
	}
	return nodes, nil
}

func (c *Collection) appendNamedObjects(name string, edges ...*Object) {
	if c.Edges.namedObjects == nil {
		c.Edges.namedObjects = make(map[string][]*Object)
	}
	if len(edges) == 0 {
		c.Edges.namedObjects[name] = []*Object{}
	} else {
		c.Edges.namedObjects[name] = append(c.Edges.namedObjects[name], edges...)
	}
}

// NamedUsers returns the Users named value or an error if the edge was not
// loaded in eager-loading with this name.
func (c *Collection) NamedUsers(name string) ([]*User, error) {
	if c.Edges.namedUsers == nil {
		return nil, &NotLoadedError{edge: name}
	}
	nodes, ok := c.Edges.namedUsers[name]
	if !ok {
		return nil, &NotLoadedError{edge: name}
	}
	return nodes, nil
}

func (c *Collection) appendNamedUsers(name string, edges ...*User) {
	if c.Edges.namedUsers == nil {
		c.Edges.namedUsers = make(map[string][]*User)
	}
	if len(edges) == 0 {
		c.Edges.namedUsers[name] = []*User{}
	} else {
		c.Edges.namedUsers[name] = append(c.Edges.namedUsers[name], edges...)
	}
}

// Collections is a parsable slice of Collection.
type Collections []*Collection
