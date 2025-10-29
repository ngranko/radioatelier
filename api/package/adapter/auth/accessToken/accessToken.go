package accessToken

import (
    "fmt"
    "time"

    "github.com/lestrrat-go/jwx/v2/jwa"
    "github.com/lestrrat-go/jwx/v2/jwe"
    "github.com/lestrrat-go/jwx/v2/jwk"
    "github.com/lestrrat-go/jwx/v2/jwt"

    "radioatelier/package/adapter/db/model"
    "radioatelier/package/config"
    "radioatelier/package/infrastructure/ulid"
)

type accessToken struct {
    rawToken jwt.Token
}

type AccessToken interface {
    Encode() (string, error)
    Verify() error
    UserID() ulid.ULID
}

func NewFromRaw(rawToken jwt.Token) AccessToken {
    return &accessToken{rawToken: rawToken}
}

func NewFromUser(user *model.User) (AccessToken, error) {
    token, err := jwt.NewBuilder().
        Issuer("acts").
        IssuedAt(time.Now()).
        // TODO: move expiration to config
        Expiration(time.Now().Add(time.Minute*15)).
        Claim("user_id", user.ID.String()).
        Build()
    if err != nil {
        fmt.Printf("failed to build token: %s\n", err)
        return nil, err
    }

    return &accessToken{rawToken: token}, nil
}

func NewFromEncoded(encoded string) (AccessToken, error) {
    privkey, err := readPrivateKey()
    if err != nil {
        fmt.Printf("failed to read private key: %s\n", err)
        return nil, err
    }

    decrypted, err := jwe.Decrypt([]byte(encoded), jwe.WithKey(jwa.RSA_OAEP, privkey))
    if err != nil {
        fmt.Printf("failed to decrypt payload: %s\n", err)
        return nil, err
    }

    signkey, err := jwk.FromRaw([]byte(config.Get().JWTSecret))
    if err != nil {
        fmt.Printf("failed to create symmetric key: %s\n", err)
        return nil, err
    }

    rawToken, err := jwt.Parse(decrypted, jwt.WithKey(jwa.HS256, signkey), jwt.WithValidate(false))
    if err != nil {
        fmt.Printf("jwt.Parse failed: %s\n", err)
        return nil, err
    }

    return &accessToken{rawToken: rawToken}, nil
}

func (t *accessToken) Encode() (string, error) {
    signkey, err := jwk.FromRaw([]byte(config.Get().JWTSecret))
    if err != nil {
        fmt.Printf("failed to create symmetric key: %s\n", err)
        return "", err
    }

    serialized, err := jwt.NewSerializer().
        Sign(jwt.WithKey(jwa.HS256, signkey)).
        Serialize(t.rawToken)
    if err != nil {
        fmt.Printf("failed to encrypt and sign token: %s\n", err)
        return "", err
    }

    privkey, err := readPrivateKey()
    if err != nil {
        fmt.Printf("failed to create private key: %s\n", err)
        return "", err
    }

    pubkey, err := privkey.PublicKey()
    if err != nil {
        fmt.Printf("failed to create public key:%s\n", err)
        return "", err
    }

    encrypted, err := jwe.Encrypt(serialized, jwe.WithKey(jwa.RSA_OAEP, pubkey))
    if err != nil {
        fmt.Printf("failed to encrypt payload: %s\n", err)
        return "", err
    }

    return string(encrypted), nil
}

func (t *accessToken) Verify() error {
    return jwt.Validate(t.rawToken)
}

func (t *accessToken) UserID() ulid.ULID {
    raw, ok := t.rawToken.Get("user_id")
    if !ok {
        return ulid.NewULID()
    }

    val, err := ulid.Parse(raw.(string))
    if err != nil {
        return ulid.NewULID()
    }

    return val
}
