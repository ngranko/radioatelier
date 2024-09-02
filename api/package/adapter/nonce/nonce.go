package nonce

import (
    "sync"
    "time"

    "github.com/thanhpk/randstr"

    "radioatelier/package/config"
)

type nonceStore struct {
    store map[string]time.Time
    sync.RWMutex
}

type Store interface {
    Create() string
    Use(string) bool
    Delete(string)
}

var store *nonceStore

func init() {
    store = &nonceStore{store: make(map[string]time.Time)}
}

func GetNonceStore() Store {
    return store
}

func (s *nonceStore) Create() string {
    s.Lock()
    defer s.Unlock()

    s.trim()

    for {
        token := randstr.Hex(64)

        if _, ok := s.store[token]; !ok {
            s.store[token] = time.Now()
            return token
        }
    }
}

func (s *nonceStore) Use(token string) bool {
    s.Lock()
    defer s.Unlock()

    s.trim()

    isValid := s.tokenExists(token) && isNonceValid(s.store[token])
    s.Delete(token)
    return isValid
}

func (s *nonceStore) Delete(token string) {
    delete(s.store, token)
}

func (s *nonceStore) tokenExists(token string) bool {
    _, ok := s.store[token]
    return ok
}

func (s *nonceStore) trim() {
    for token, createdOn := range s.store {
        if !isNonceValid(createdOn) {
            s.Delete(token)
        }
    }
}

func isNonceValid(createdOn time.Time) bool {
    return time.Since(createdOn) < config.Get().WebSocket.NonceLifespan
}
