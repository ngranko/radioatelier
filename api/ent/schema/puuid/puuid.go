package puuid

import (
	"database/sql/driver"
	"fmt"
	"io"
	"strconv"

	"github.com/google/uuid"
)

// ID implements a PUUID - a prefixed UUID.
type ID string

// MustNew returns a new PUUID for time.Now() given a prefix. This uses the default entropy source.
func MustNew(prefix string) ID { return ID(prefix + "-" + fmt.Sprint(uuid.New())) }

// UnmarshalGQL implements the graphql.Unmarshaler interface
func (u *ID) UnmarshalGQL(v interface{}) error {
	return u.Scan(v)
}

// MarshalGQL implements the graphql.Marshaler interface
func (u ID) MarshalGQL(w io.Writer) {
	_, _ = io.WriteString(w, strconv.Quote(string(u)))
}

// Scan implements the Scanner interface.
func (u *ID) Scan(src interface{}) error {
	if src == nil {
		return fmt.Errorf("puuid: expected a value")
	}

	switch src := src.(type) {
	case []byte:
		*u = ID(string(src))
	case string:
		*u = ID(src)
	case ID:
		*u = src
	default:
		return fmt.Errorf("puuid: unexpected input format: %T", src)
	}
	return nil
}

// Value implements the driver Valuer interface.
func (u ID) Value() (driver.Value, error) {
	return string(u), nil
}
