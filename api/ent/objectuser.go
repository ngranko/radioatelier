// Code generated by ent, DO NOT EDIT.

package ent

import (
	"fmt"
	"radioatelier/ent/object"
	"radioatelier/ent/objectuser"
	"radioatelier/ent/schema/puuid"
	"radioatelier/ent/user"
	"strings"
	"time"

	"entgo.io/ent/dialect/sql"
)

// ObjectUser is the model entity for the ObjectUser schema.
type ObjectUser struct {
	config `json:"-"`
	// UserID holds the value of the "user_id" field.
	UserID puuid.ID `json:"user_id,omitempty"`
	// ObjectID holds the value of the "object_id" field.
	ObjectID puuid.ID `json:"object_id,omitempty"`
	// IsVisited holds the value of the "is_visited" field.
	IsVisited bool `json:"is_visited,omitempty"`
	// LastVisit holds the value of the "last_visit" field.
	LastVisit *time.Time `json:"last_visit,omitempty"`
	// Edges holds the relations/edges for other nodes in the graph.
	// The values are being populated by the ObjectUserQuery when eager-loading is set.
	Edges ObjectUserEdges `json:"edges"`
}

// ObjectUserEdges holds the relations/edges for other nodes in the graph.
type ObjectUserEdges struct {
	// User holds the value of the user edge.
	User *User `json:"user,omitempty"`
	// Object holds the value of the object edge.
	Object *Object `json:"object,omitempty"`
	// loadedTypes holds the information for reporting if a
	// type was loaded (or requested) in eager-loading or not.
	loadedTypes [2]bool
	// totalCount holds the count of the edges above.
	totalCount [2]*int
}

// UserOrErr returns the User value or an error if the edge
// was not loaded in eager-loading, or loaded but was not found.
func (e ObjectUserEdges) UserOrErr() (*User, error) {
	if e.loadedTypes[0] {
		if e.User == nil {
			// The edge user was loaded in eager-loading,
			// but was not found.
			return nil, &NotFoundError{label: user.Label}
		}
		return e.User, nil
	}
	return nil, &NotLoadedError{edge: "user"}
}

// ObjectOrErr returns the Object value or an error if the edge
// was not loaded in eager-loading, or loaded but was not found.
func (e ObjectUserEdges) ObjectOrErr() (*Object, error) {
	if e.loadedTypes[1] {
		if e.Object == nil {
			// The edge object was loaded in eager-loading,
			// but was not found.
			return nil, &NotFoundError{label: object.Label}
		}
		return e.Object, nil
	}
	return nil, &NotLoadedError{edge: "object"}
}

// scanValues returns the types for scanning values from sql.Rows.
func (*ObjectUser) scanValues(columns []string) ([]interface{}, error) {
	values := make([]interface{}, len(columns))
	for i := range columns {
		switch columns[i] {
		case objectuser.FieldUserID, objectuser.FieldObjectID:
			values[i] = new(puuid.ID)
		case objectuser.FieldIsVisited:
			values[i] = new(sql.NullBool)
		case objectuser.FieldLastVisit:
			values[i] = new(sql.NullTime)
		default:
			return nil, fmt.Errorf("unexpected column %q for type ObjectUser", columns[i])
		}
	}
	return values, nil
}

// assignValues assigns the values that were returned from sql.Rows (after scanning)
// to the ObjectUser fields.
func (ou *ObjectUser) assignValues(columns []string, values []interface{}) error {
	if m, n := len(values), len(columns); m < n {
		return fmt.Errorf("mismatch number of scan values: %d != %d", m, n)
	}
	for i := range columns {
		switch columns[i] {
		case objectuser.FieldUserID:
			if value, ok := values[i].(*puuid.ID); !ok {
				return fmt.Errorf("unexpected type %T for field user_id", values[i])
			} else if value != nil {
				ou.UserID = *value
			}
		case objectuser.FieldObjectID:
			if value, ok := values[i].(*puuid.ID); !ok {
				return fmt.Errorf("unexpected type %T for field object_id", values[i])
			} else if value != nil {
				ou.ObjectID = *value
			}
		case objectuser.FieldIsVisited:
			if value, ok := values[i].(*sql.NullBool); !ok {
				return fmt.Errorf("unexpected type %T for field is_visited", values[i])
			} else if value.Valid {
				ou.IsVisited = value.Bool
			}
		case objectuser.FieldLastVisit:
			if value, ok := values[i].(*sql.NullTime); !ok {
				return fmt.Errorf("unexpected type %T for field last_visit", values[i])
			} else if value.Valid {
				ou.LastVisit = new(time.Time)
				*ou.LastVisit = value.Time
			}
		}
	}
	return nil
}

// QueryUser queries the "user" edge of the ObjectUser entity.
func (ou *ObjectUser) QueryUser() *UserQuery {
	return (&ObjectUserClient{config: ou.config}).QueryUser(ou)
}

// QueryObject queries the "object" edge of the ObjectUser entity.
func (ou *ObjectUser) QueryObject() *ObjectQuery {
	return (&ObjectUserClient{config: ou.config}).QueryObject(ou)
}

// Update returns a builder for updating this ObjectUser.
// Note that you need to call ObjectUser.Unwrap() before calling this method if this ObjectUser
// was returned from a transaction, and the transaction was committed or rolled back.
func (ou *ObjectUser) Update() *ObjectUserUpdateOne {
	return (&ObjectUserClient{config: ou.config}).UpdateOne(ou)
}

// Unwrap unwraps the ObjectUser entity that was returned from a transaction after it was closed,
// so that all future queries will be executed through the driver which created the transaction.
func (ou *ObjectUser) Unwrap() *ObjectUser {
	_tx, ok := ou.config.driver.(*txDriver)
	if !ok {
		panic("ent: ObjectUser is not a transactional entity")
	}
	ou.config.driver = _tx.drv
	return ou
}

// String implements the fmt.Stringer.
func (ou *ObjectUser) String() string {
	var builder strings.Builder
	builder.WriteString("ObjectUser(")
	builder.WriteString("user_id=")
	builder.WriteString(fmt.Sprintf("%v", ou.UserID))
	builder.WriteString(", ")
	builder.WriteString("object_id=")
	builder.WriteString(fmt.Sprintf("%v", ou.ObjectID))
	builder.WriteString(", ")
	builder.WriteString("is_visited=")
	builder.WriteString(fmt.Sprintf("%v", ou.IsVisited))
	builder.WriteString(", ")
	if v := ou.LastVisit; v != nil {
		builder.WriteString("last_visit=")
		builder.WriteString(v.Format(time.ANSIC))
	}
	builder.WriteByte(')')
	return builder.String()
}

// ObjectUsers is a parsable slice of ObjectUser.
type ObjectUsers []*ObjectUser

func (ou ObjectUsers) config(cfg config) {
	for _i := range ou {
		ou[_i].config = cfg
	}
}