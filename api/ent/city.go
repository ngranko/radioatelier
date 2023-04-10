// Code generated by ent, DO NOT EDIT.

package ent

import (
	"fmt"
	"radioatelier/ent/city"
	"radioatelier/ent/schema/puuid"
	"strings"

	"entgo.io/ent/dialect/sql"
)

// City is the model entity for the City schema.
type City struct {
	config `json:"-"`
	// ID of the ent.
	ID puuid.ID `json:"id,omitempty"`
	// Name holds the value of the "name" field.
	Name string `json:"name,omitempty"`
	// Country holds the value of the "country" field.
	Country string `json:"country,omitempty"`
	// Edges holds the relations/edges for other nodes in the graph.
	// The values are being populated by the CityQuery when eager-loading is set.
	Edges CityEdges `json:"edges"`
}

// CityEdges holds the relations/edges for other nodes in the graph.
type CityEdges struct {
	// Objects holds the value of the objects edge.
	Objects []*Object `json:"objects,omitempty"`
	// loadedTypes holds the information for reporting if a
	// type was loaded (or requested) in eager-loading or not.
	loadedTypes [1]bool
	// totalCount holds the count of the edges above.
	totalCount [1]map[string]int

	namedObjects map[string][]*Object
}

// ObjectsOrErr returns the Objects value or an error if the edge
// was not loaded in eager-loading.
func (e CityEdges) ObjectsOrErr() ([]*Object, error) {
	if e.loadedTypes[0] {
		return e.Objects, nil
	}
	return nil, &NotLoadedError{edge: "objects"}
}

// scanValues returns the types for scanning values from sql.Rows.
func (*City) scanValues(columns []string) ([]any, error) {
	values := make([]any, len(columns))
	for i := range columns {
		switch columns[i] {
		case city.FieldID:
			values[i] = new(puuid.ID)
		case city.FieldName, city.FieldCountry:
			values[i] = new(sql.NullString)
		default:
			return nil, fmt.Errorf("unexpected column %q for type City", columns[i])
		}
	}
	return values, nil
}

// assignValues assigns the values that were returned from sql.Rows (after scanning)
// to the City fields.
func (c *City) assignValues(columns []string, values []any) error {
	if m, n := len(values), len(columns); m < n {
		return fmt.Errorf("mismatch number of scan values: %d != %d", m, n)
	}
	for i := range columns {
		switch columns[i] {
		case city.FieldID:
			if value, ok := values[i].(*puuid.ID); !ok {
				return fmt.Errorf("unexpected type %T for field id", values[i])
			} else if value != nil {
				c.ID = *value
			}
		case city.FieldName:
			if value, ok := values[i].(*sql.NullString); !ok {
				return fmt.Errorf("unexpected type %T for field name", values[i])
			} else if value.Valid {
				c.Name = value.String
			}
		case city.FieldCountry:
			if value, ok := values[i].(*sql.NullString); !ok {
				return fmt.Errorf("unexpected type %T for field country", values[i])
			} else if value.Valid {
				c.Country = value.String
			}
		}
	}
	return nil
}

// QueryObjects queries the "objects" edge of the City entity.
func (c *City) QueryObjects() *ObjectQuery {
	return NewCityClient(c.config).QueryObjects(c)
}

// Update returns a builder for updating this City.
// Note that you need to call City.Unwrap() before calling this method if this City
// was returned from a transaction, and the transaction was committed or rolled back.
func (c *City) Update() *CityUpdateOne {
	return NewCityClient(c.config).UpdateOne(c)
}

// Unwrap unwraps the City entity that was returned from a transaction after it was closed,
// so that all future queries will be executed through the driver which created the transaction.
func (c *City) Unwrap() *City {
	_tx, ok := c.config.driver.(*txDriver)
	if !ok {
		panic("ent: City is not a transactional entity")
	}
	c.config.driver = _tx.drv
	return c
}

// String implements the fmt.Stringer.
func (c *City) String() string {
	var builder strings.Builder
	builder.WriteString("City(")
	builder.WriteString(fmt.Sprintf("id=%v, ", c.ID))
	builder.WriteString("name=")
	builder.WriteString(c.Name)
	builder.WriteString(", ")
	builder.WriteString("country=")
	builder.WriteString(c.Country)
	builder.WriteByte(')')
	return builder.String()
}

// NamedObjects returns the Objects named value or an error if the edge was not
// loaded in eager-loading with this name.
func (c *City) NamedObjects(name string) ([]*Object, error) {
	if c.Edges.namedObjects == nil {
		return nil, &NotLoadedError{edge: name}
	}
	nodes, ok := c.Edges.namedObjects[name]
	if !ok {
		return nil, &NotLoadedError{edge: name}
	}
	return nodes, nil
}

func (c *City) appendNamedObjects(name string, edges ...*Object) {
	if c.Edges.namedObjects == nil {
		c.Edges.namedObjects = make(map[string][]*Object)
	}
	if len(edges) == 0 {
		c.Edges.namedObjects[name] = []*Object{}
	} else {
		c.Edges.namedObjects[name] = append(c.Edges.namedObjects[name], edges...)
	}
}

// Cities is a parsable slice of City.
type Cities []*City
