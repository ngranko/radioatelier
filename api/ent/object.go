// Code generated by ent, DO NOT EDIT.

package ent

import (
	"fmt"
	"radioatelier/ent/city"
	"radioatelier/ent/object"
	"radioatelier/ent/schema/puuid"
	"radioatelier/ent/user"
	"strings"
	"time"

	"entgo.io/ent/dialect/sql"
)

// Object is the model entity for the Object schema.
type Object struct {
	config `json:"-"`
	// ID of the ent.
	ID puuid.ID `json:"id,omitempty"`
	// Name holds the value of the "name" field.
	Name string `json:"name,omitempty"`
	// Address holds the value of the "address" field.
	Address string `json:"address,omitempty"`
	// Description holds the value of the "description" field.
	Description string `json:"description,omitempty"`
	// Lat holds the value of the "lat" field.
	Lat *float64 `json:"lat,omitempty"`
	// Lng holds the value of the "lng" field.
	Lng *float64 `json:"lng,omitempty"`
	// InstalledPeriod holds the value of the "installed_period" field.
	InstalledPeriod *string `json:"installed_period,omitempty"`
	// IsRemoved holds the value of the "is_removed" field.
	IsRemoved bool `json:"is_removed,omitempty"`
	// RemovedPeriod holds the value of the "removed_period" field.
	RemovedPeriod *string `json:"removed_period,omitempty"`
	// Source holds the value of the "source" field.
	Source *string `json:"source,omitempty"`
	// Type holds the value of the "type" field.
	Type string `json:"type,omitempty"`
	// Tags holds the value of the "tags" field.
	Tags string `json:"tags,omitempty"`
	// CreatedAt holds the value of the "created_at" field.
	CreatedAt time.Time `json:"created_at,omitempty"`
	// UpdatedAt holds the value of the "updated_at" field.
	UpdatedAt time.Time `json:"updated_at,omitempty"`
	// DeletedAt holds the value of the "deleted_at" field.
	DeletedAt *time.Time `json:"deleted_at,omitempty"`
	// LastSync holds the value of the "last_sync" field.
	LastSync *time.Time `json:"last_sync,omitempty"`
	// NotionID holds the value of the "notion_id" field.
	NotionID *string `json:"notion_id,omitempty"`
	// Edges holds the relations/edges for other nodes in the graph.
	// The values are being populated by the ObjectQuery when eager-loading is set.
	Edges      ObjectEdges `json:"edges"`
	city_id    *puuid.ID
	created_by *puuid.ID
	updated_by *puuid.ID
	deleted_by *puuid.ID
}

// ObjectEdges holds the relations/edges for other nodes in the graph.
type ObjectEdges struct {
	// CreatedBy holds the value of the created_by edge.
	CreatedBy *User `json:"created_by,omitempty"`
	// UpdatedBy holds the value of the updated_by edge.
	UpdatedBy *User `json:"updated_by,omitempty"`
	// DeletedBy holds the value of the deleted_by edge.
	DeletedBy *User `json:"deleted_by,omitempty"`
	// Collections holds the value of the collections edge.
	Collections []*Collection `json:"collections,omitempty"`
	// UserInfo holds the value of the user_info edge.
	UserInfo []*User `json:"user_info,omitempty"`
	// City holds the value of the city edge.
	City *City `json:"city,omitempty"`
	// ObjectUser holds the value of the object_user edge.
	ObjectUser []*ObjectUser `json:"object_user,omitempty"`
	// loadedTypes holds the information for reporting if a
	// type was loaded (or requested) in eager-loading or not.
	loadedTypes [7]bool
	// totalCount holds the count of the edges above.
	totalCount [6]*int
}

// CreatedByOrErr returns the CreatedBy value or an error if the edge
// was not loaded in eager-loading, or loaded but was not found.
func (e ObjectEdges) CreatedByOrErr() (*User, error) {
	if e.loadedTypes[0] {
		if e.CreatedBy == nil {
			// The edge created_by was loaded in eager-loading,
			// but was not found.
			return nil, &NotFoundError{label: user.Label}
		}
		return e.CreatedBy, nil
	}
	return nil, &NotLoadedError{edge: "created_by"}
}

// UpdatedByOrErr returns the UpdatedBy value or an error if the edge
// was not loaded in eager-loading, or loaded but was not found.
func (e ObjectEdges) UpdatedByOrErr() (*User, error) {
	if e.loadedTypes[1] {
		if e.UpdatedBy == nil {
			// The edge updated_by was loaded in eager-loading,
			// but was not found.
			return nil, &NotFoundError{label: user.Label}
		}
		return e.UpdatedBy, nil
	}
	return nil, &NotLoadedError{edge: "updated_by"}
}

// DeletedByOrErr returns the DeletedBy value or an error if the edge
// was not loaded in eager-loading, or loaded but was not found.
func (e ObjectEdges) DeletedByOrErr() (*User, error) {
	if e.loadedTypes[2] {
		if e.DeletedBy == nil {
			// The edge deleted_by was loaded in eager-loading,
			// but was not found.
			return nil, &NotFoundError{label: user.Label}
		}
		return e.DeletedBy, nil
	}
	return nil, &NotLoadedError{edge: "deleted_by"}
}

// CollectionsOrErr returns the Collections value or an error if the edge
// was not loaded in eager-loading.
func (e ObjectEdges) CollectionsOrErr() ([]*Collection, error) {
	if e.loadedTypes[3] {
		return e.Collections, nil
	}
	return nil, &NotLoadedError{edge: "collections"}
}

// UserInfoOrErr returns the UserInfo value or an error if the edge
// was not loaded in eager-loading.
func (e ObjectEdges) UserInfoOrErr() ([]*User, error) {
	if e.loadedTypes[4] {
		return e.UserInfo, nil
	}
	return nil, &NotLoadedError{edge: "user_info"}
}

// CityOrErr returns the City value or an error if the edge
// was not loaded in eager-loading, or loaded but was not found.
func (e ObjectEdges) CityOrErr() (*City, error) {
	if e.loadedTypes[5] {
		if e.City == nil {
			// The edge city was loaded in eager-loading,
			// but was not found.
			return nil, &NotFoundError{label: city.Label}
		}
		return e.City, nil
	}
	return nil, &NotLoadedError{edge: "city"}
}

// ObjectUserOrErr returns the ObjectUser value or an error if the edge
// was not loaded in eager-loading.
func (e ObjectEdges) ObjectUserOrErr() ([]*ObjectUser, error) {
	if e.loadedTypes[6] {
		return e.ObjectUser, nil
	}
	return nil, &NotLoadedError{edge: "object_user"}
}

// scanValues returns the types for scanning values from sql.Rows.
func (*Object) scanValues(columns []string) ([]interface{}, error) {
	values := make([]interface{}, len(columns))
	for i := range columns {
		switch columns[i] {
		case object.FieldID:
			values[i] = new(puuid.ID)
		case object.FieldIsRemoved:
			values[i] = new(sql.NullBool)
		case object.FieldLat, object.FieldLng:
			values[i] = new(sql.NullFloat64)
		case object.FieldName, object.FieldAddress, object.FieldDescription, object.FieldInstalledPeriod, object.FieldRemovedPeriod, object.FieldSource, object.FieldType, object.FieldTags, object.FieldNotionID:
			values[i] = new(sql.NullString)
		case object.FieldCreatedAt, object.FieldUpdatedAt, object.FieldDeletedAt, object.FieldLastSync:
			values[i] = new(sql.NullTime)
		case object.ForeignKeys[0]: // city_id
			values[i] = &sql.NullScanner{S: new(puuid.ID)}
		case object.ForeignKeys[1]: // created_by
			values[i] = &sql.NullScanner{S: new(puuid.ID)}
		case object.ForeignKeys[2]: // updated_by
			values[i] = &sql.NullScanner{S: new(puuid.ID)}
		case object.ForeignKeys[3]: // deleted_by
			values[i] = &sql.NullScanner{S: new(puuid.ID)}
		default:
			return nil, fmt.Errorf("unexpected column %q for type Object", columns[i])
		}
	}
	return values, nil
}

// assignValues assigns the values that were returned from sql.Rows (after scanning)
// to the Object fields.
func (o *Object) assignValues(columns []string, values []interface{}) error {
	if m, n := len(values), len(columns); m < n {
		return fmt.Errorf("mismatch number of scan values: %d != %d", m, n)
	}
	for i := range columns {
		switch columns[i] {
		case object.FieldID:
			if value, ok := values[i].(*puuid.ID); !ok {
				return fmt.Errorf("unexpected type %T for field id", values[i])
			} else if value != nil {
				o.ID = *value
			}
		case object.FieldName:
			if value, ok := values[i].(*sql.NullString); !ok {
				return fmt.Errorf("unexpected type %T for field name", values[i])
			} else if value.Valid {
				o.Name = value.String
			}
		case object.FieldAddress:
			if value, ok := values[i].(*sql.NullString); !ok {
				return fmt.Errorf("unexpected type %T for field address", values[i])
			} else if value.Valid {
				o.Address = value.String
			}
		case object.FieldDescription:
			if value, ok := values[i].(*sql.NullString); !ok {
				return fmt.Errorf("unexpected type %T for field description", values[i])
			} else if value.Valid {
				o.Description = value.String
			}
		case object.FieldLat:
			if value, ok := values[i].(*sql.NullFloat64); !ok {
				return fmt.Errorf("unexpected type %T for field lat", values[i])
			} else if value.Valid {
				o.Lat = new(float64)
				*o.Lat = value.Float64
			}
		case object.FieldLng:
			if value, ok := values[i].(*sql.NullFloat64); !ok {
				return fmt.Errorf("unexpected type %T for field lng", values[i])
			} else if value.Valid {
				o.Lng = new(float64)
				*o.Lng = value.Float64
			}
		case object.FieldInstalledPeriod:
			if value, ok := values[i].(*sql.NullString); !ok {
				return fmt.Errorf("unexpected type %T for field installed_period", values[i])
			} else if value.Valid {
				o.InstalledPeriod = new(string)
				*o.InstalledPeriod = value.String
			}
		case object.FieldIsRemoved:
			if value, ok := values[i].(*sql.NullBool); !ok {
				return fmt.Errorf("unexpected type %T for field is_removed", values[i])
			} else if value.Valid {
				o.IsRemoved = value.Bool
			}
		case object.FieldRemovedPeriod:
			if value, ok := values[i].(*sql.NullString); !ok {
				return fmt.Errorf("unexpected type %T for field removed_period", values[i])
			} else if value.Valid {
				o.RemovedPeriod = new(string)
				*o.RemovedPeriod = value.String
			}
		case object.FieldSource:
			if value, ok := values[i].(*sql.NullString); !ok {
				return fmt.Errorf("unexpected type %T for field source", values[i])
			} else if value.Valid {
				o.Source = new(string)
				*o.Source = value.String
			}
		case object.FieldType:
			if value, ok := values[i].(*sql.NullString); !ok {
				return fmt.Errorf("unexpected type %T for field type", values[i])
			} else if value.Valid {
				o.Type = value.String
			}
		case object.FieldTags:
			if value, ok := values[i].(*sql.NullString); !ok {
				return fmt.Errorf("unexpected type %T for field tags", values[i])
			} else if value.Valid {
				o.Tags = value.String
			}
		case object.FieldCreatedAt:
			if value, ok := values[i].(*sql.NullTime); !ok {
				return fmt.Errorf("unexpected type %T for field created_at", values[i])
			} else if value.Valid {
				o.CreatedAt = value.Time
			}
		case object.FieldUpdatedAt:
			if value, ok := values[i].(*sql.NullTime); !ok {
				return fmt.Errorf("unexpected type %T for field updated_at", values[i])
			} else if value.Valid {
				o.UpdatedAt = value.Time
			}
		case object.FieldDeletedAt:
			if value, ok := values[i].(*sql.NullTime); !ok {
				return fmt.Errorf("unexpected type %T for field deleted_at", values[i])
			} else if value.Valid {
				o.DeletedAt = new(time.Time)
				*o.DeletedAt = value.Time
			}
		case object.FieldLastSync:
			if value, ok := values[i].(*sql.NullTime); !ok {
				return fmt.Errorf("unexpected type %T for field last_sync", values[i])
			} else if value.Valid {
				o.LastSync = new(time.Time)
				*o.LastSync = value.Time
			}
		case object.FieldNotionID:
			if value, ok := values[i].(*sql.NullString); !ok {
				return fmt.Errorf("unexpected type %T for field notion_id", values[i])
			} else if value.Valid {
				o.NotionID = new(string)
				*o.NotionID = value.String
			}
		case object.ForeignKeys[0]:
			if value, ok := values[i].(*sql.NullScanner); !ok {
				return fmt.Errorf("unexpected type %T for field city_id", values[i])
			} else if value.Valid {
				o.city_id = new(puuid.ID)
				*o.city_id = *value.S.(*puuid.ID)
			}
		case object.ForeignKeys[1]:
			if value, ok := values[i].(*sql.NullScanner); !ok {
				return fmt.Errorf("unexpected type %T for field created_by", values[i])
			} else if value.Valid {
				o.created_by = new(puuid.ID)
				*o.created_by = *value.S.(*puuid.ID)
			}
		case object.ForeignKeys[2]:
			if value, ok := values[i].(*sql.NullScanner); !ok {
				return fmt.Errorf("unexpected type %T for field updated_by", values[i])
			} else if value.Valid {
				o.updated_by = new(puuid.ID)
				*o.updated_by = *value.S.(*puuid.ID)
			}
		case object.ForeignKeys[3]:
			if value, ok := values[i].(*sql.NullScanner); !ok {
				return fmt.Errorf("unexpected type %T for field deleted_by", values[i])
			} else if value.Valid {
				o.deleted_by = new(puuid.ID)
				*o.deleted_by = *value.S.(*puuid.ID)
			}
		}
	}
	return nil
}

// QueryCreatedBy queries the "created_by" edge of the Object entity.
func (o *Object) QueryCreatedBy() *UserQuery {
	return (&ObjectClient{config: o.config}).QueryCreatedBy(o)
}

// QueryUpdatedBy queries the "updated_by" edge of the Object entity.
func (o *Object) QueryUpdatedBy() *UserQuery {
	return (&ObjectClient{config: o.config}).QueryUpdatedBy(o)
}

// QueryDeletedBy queries the "deleted_by" edge of the Object entity.
func (o *Object) QueryDeletedBy() *UserQuery {
	return (&ObjectClient{config: o.config}).QueryDeletedBy(o)
}

// QueryCollections queries the "collections" edge of the Object entity.
func (o *Object) QueryCollections() *CollectionQuery {
	return (&ObjectClient{config: o.config}).QueryCollections(o)
}

// QueryUserInfo queries the "user_info" edge of the Object entity.
func (o *Object) QueryUserInfo() *UserQuery {
	return (&ObjectClient{config: o.config}).QueryUserInfo(o)
}

// QueryCity queries the "city" edge of the Object entity.
func (o *Object) QueryCity() *CityQuery {
	return (&ObjectClient{config: o.config}).QueryCity(o)
}

// QueryObjectUser queries the "object_user" edge of the Object entity.
func (o *Object) QueryObjectUser() *ObjectUserQuery {
	return (&ObjectClient{config: o.config}).QueryObjectUser(o)
}

// Update returns a builder for updating this Object.
// Note that you need to call Object.Unwrap() before calling this method if this Object
// was returned from a transaction, and the transaction was committed or rolled back.
func (o *Object) Update() *ObjectUpdateOne {
	return (&ObjectClient{config: o.config}).UpdateOne(o)
}

// Unwrap unwraps the Object entity that was returned from a transaction after it was closed,
// so that all future queries will be executed through the driver which created the transaction.
func (o *Object) Unwrap() *Object {
	_tx, ok := o.config.driver.(*txDriver)
	if !ok {
		panic("ent: Object is not a transactional entity")
	}
	o.config.driver = _tx.drv
	return o
}

// String implements the fmt.Stringer.
func (o *Object) String() string {
	var builder strings.Builder
	builder.WriteString("Object(")
	builder.WriteString(fmt.Sprintf("id=%v, ", o.ID))
	builder.WriteString("name=")
	builder.WriteString(o.Name)
	builder.WriteString(", ")
	builder.WriteString("address=")
	builder.WriteString(o.Address)
	builder.WriteString(", ")
	builder.WriteString("description=")
	builder.WriteString(o.Description)
	builder.WriteString(", ")
	if v := o.Lat; v != nil {
		builder.WriteString("lat=")
		builder.WriteString(fmt.Sprintf("%v", *v))
	}
	builder.WriteString(", ")
	if v := o.Lng; v != nil {
		builder.WriteString("lng=")
		builder.WriteString(fmt.Sprintf("%v", *v))
	}
	builder.WriteString(", ")
	if v := o.InstalledPeriod; v != nil {
		builder.WriteString("installed_period=")
		builder.WriteString(*v)
	}
	builder.WriteString(", ")
	builder.WriteString("is_removed=")
	builder.WriteString(fmt.Sprintf("%v", o.IsRemoved))
	builder.WriteString(", ")
	if v := o.RemovedPeriod; v != nil {
		builder.WriteString("removed_period=")
		builder.WriteString(*v)
	}
	builder.WriteString(", ")
	if v := o.Source; v != nil {
		builder.WriteString("source=")
		builder.WriteString(*v)
	}
	builder.WriteString(", ")
	builder.WriteString("type=")
	builder.WriteString(o.Type)
	builder.WriteString(", ")
	builder.WriteString("tags=")
	builder.WriteString(o.Tags)
	builder.WriteString(", ")
	builder.WriteString("created_at=")
	builder.WriteString(o.CreatedAt.Format(time.ANSIC))
	builder.WriteString(", ")
	builder.WriteString("updated_at=")
	builder.WriteString(o.UpdatedAt.Format(time.ANSIC))
	builder.WriteString(", ")
	if v := o.DeletedAt; v != nil {
		builder.WriteString("deleted_at=")
		builder.WriteString(v.Format(time.ANSIC))
	}
	builder.WriteString(", ")
	if v := o.LastSync; v != nil {
		builder.WriteString("last_sync=")
		builder.WriteString(v.Format(time.ANSIC))
	}
	builder.WriteString(", ")
	if v := o.NotionID; v != nil {
		builder.WriteString("notion_id=")
		builder.WriteString(*v)
	}
	builder.WriteByte(')')
	return builder.String()
}

// Objects is a parsable slice of Object.
type Objects []*Object

func (o Objects) config(cfg config) {
	for _i := range o {
		o[_i].config = cfg
	}
}
