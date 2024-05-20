package auth

import (
	"github.com/thanhpk/randstr"
)

func GenerateRefreshToken() string {
	return randstr.Hex(128)
}
