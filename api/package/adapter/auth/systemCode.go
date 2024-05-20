package auth

import (
	"github.com/thanhpk/randstr"
)

func GenerateSystemCode() string {
	return randstr.String(64)
}
