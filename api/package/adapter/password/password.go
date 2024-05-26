package password

import (
    "github.com/trustelem/zxcvbn"
    "golang.org/x/crypto/bcrypt"

    "radioatelier/package/config"
)

type Password struct {
    raw string
    Hashable
    Verifiable
    StrengthLimitable
}

type Hashable interface {
    Hash() (string, error)
}

type Verifiable interface {
    Verify(hash string) bool
}

type StrengthLimitable interface {
    IsStrong() bool
}

func NewFromRaw(raw string) *Password {
    return &Password{raw: raw}
}

func (p *Password) Hash() (string, error) {
    hashed, err := bcrypt.GenerateFromPassword([]byte(p.raw), 10)
    return string(hashed), err
}

func (p *Password) Verify(hash string) error {
    return bcrypt.CompareHashAndPassword([]byte(hash), []byte(p.raw))
}

func (p *Password) IsStrong() bool {
    return zxcvbn.PasswordStrength(p.raw, []string{}).Score >= config.Get().MinPasswordScore
}
