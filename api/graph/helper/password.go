package helper

import "golang.org/x/crypto/bcrypt"

func HashPassword(pass string) (string, error) {
    hashedPassword, err := bcrypt.GenerateFromPassword([]byte(pass), 10)
    return string(hashedPassword), err
}
