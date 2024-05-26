package accessToken

import (
    "crypto/rsa"
    "os"

    "github.com/lestrrat-go/jwx/v2/jwk"
    "golang.org/x/crypto/ssh"

    "radioatelier/package/config"
)

func readPrivateKey() (jwk.Key, error) {
    keyString, err := os.ReadFile(config.Get().JWEPrivateKeyPath)
    if err != nil {
        return nil, err
    }
    block, err := ssh.ParseRawPrivateKey(keyString)
    if err != nil {
        return nil, err
    }
    key := block.(*rsa.PrivateKey)

    return jwk.FromRaw(key)
}
