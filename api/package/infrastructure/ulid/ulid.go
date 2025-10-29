package ulid

import (
    "crypto/rand"
    "database/sql/driver"
    "errors"
    "time"

    "github.com/oklog/ulid/v2"
)

type ULID [16]byte

func NewULID() ULID {
    entropy := ulid.Monotonic(rand.Reader, 0)
    id := ulid.MustNew(ulid.Timestamp(time.Now()), entropy)
    var u ULID
    copy(u[:], id.Bytes())
    return u
}

func Parse(s string) (ULID, error) {
    id, err := ulid.Parse(s)
    if err != nil {
        return ULID{}, err
    }
    var u ULID
    copy(u[:], id.Bytes())
    return u, nil
}

func (u ULID) Value() (driver.Value, error) {
    return u[:], nil
}

func (u *ULID) Scan(value any) error {
    switch v := value.(type) {
    case []byte:
        if len(v) != 16 {
            return errors.New("invalid ULID length")
        }
        copy(u[:], v)
        return nil
    case string:
        return errors.New("string scan not supported for ULID")
    default:
        return errors.New("unsupported scan type for ULID")
    }
}

func (u ULID) String() string {
    return ulid.ULID(u).String()
}

func (u ULID) MarshalJSON() ([]byte, error) {
    return []byte(`"` + u.String() + `"`), nil
}

func (u *ULID) UnmarshalJSON(data []byte) error {
    if string(data) == "null" {
        *u = ULID{}
        return nil
    }

    if len(data) < 2 || data[0] != '"' || data[len(data)-1] != '"' {
        return errors.New("invalid ULID JSON: expected string")
    }
    s := string(data[1 : len(data)-1])
    if s == "" {
        *u = ULID{}
        return nil
    }
    id, err := ulid.Parse(s)
    if err != nil {
        return err
    }
    copy((*u)[:], id.Bytes())
    return nil
}
