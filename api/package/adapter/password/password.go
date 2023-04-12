package password

import (
    "errors"

    "golang.org/x/crypto/bcrypt"
)

type Password struct {
    raw  *string
    hash *string
    Hashable
    Comparable
}

type Hashable interface {
    Hash() (string, error)
}

type Comparable interface {
    IsEqual(value string) bool
}

func NewFromRaw(raw string) *Password {
    return &Password{raw: &raw}
}

func NewFromHash(hash string) *Password {
    return &Password{hash: &hash}
}

func (p *Password) Hash() (string, error) {
    if p.raw == nil {
        return "", errors.New("cannot hash an empty password")
    }

    hashed, err := bcrypt.GenerateFromPassword([]byte(*p.raw), 10)
    hashedString := string(hashed)
    if err == nil {
        p.hash = &hashedString
    }
    return hashedString, err
}
