package presenter

import (
    "errors"
    "time"

    "radioatelier/package/adapter/auth"
    "radioatelier/package/adapter/db/model"
    "radioatelier/package/adapter/db/repository"
    "radioatelier/package/infrastructure/db"
)

type refreshTokenPresenter struct {
    repository repository.RefreshToken
    model      *model.RefreshToken
}

type RefreshToken interface {
    GetModel() *model.RefreshToken
    Renew() (RefreshToken, error)
    IsValid() bool
    Invalidate() error
}

func FindRefreshTokenByString(tokenString string) (RefreshToken, error) {
    repo := repository.NewRefreshTokenRepository(db.Get())
    token, err := repo.GetByTokenString(tokenString)
    if err != nil {
        return nil, err
    }
    return &refreshTokenPresenter{
        repository: repo,
        model:      token,
    }, nil
}

func GenerateRefreshToken(user User) (RefreshToken, error) {
    repo := repository.NewRefreshTokenRepository(db.Get())
    stringToken := auth.GenerateRefreshToken()
    token := &model.RefreshToken{
        Token:      stringToken,
        Family:     stringToken,
        ValidUntil: time.Now().Add(time.Hour * 24 * 7),
        User:       *user.GetModel(),
    }

    err := repo.Create(token)
    if err != nil {
        // TODO: can we assume that it failed because the token wasn't unique? If that is the case, we need to generate a new one and try again until we succeed
        return nil, errors.New("failed saving a new token to the database")
    }

    return &refreshTokenPresenter{
        repository: repo,
        model:      token,
    }, nil
}

func (p *refreshTokenPresenter) GetModel() *model.RefreshToken {
    return p.model
}

func (p *refreshTokenPresenter) Renew() (RefreshToken, error) {
    stringToken := auth.GenerateRefreshToken()
    token := &model.RefreshToken{
        Token:      stringToken,
        Family:     p.model.Family,
        ValidUntil: p.model.ValidUntil,
        UserID:     p.model.UserID,
        User:       p.model.User,
    }

    err := p.repository.Create(token)
    if err != nil {
        // TODO: can we assume that it failed because the token wasn't unique? If that is the case, we need to generate a new one and try again until we succeed
        return nil, errors.New("failed saving a refreshed token to the database")
    }

    return &refreshTokenPresenter{
        repository: p.repository,
        model:      token,
    }, nil
}

func (p *refreshTokenPresenter) IsValid() bool {
    return !p.model.IsUsed && !p.model.ValidUntil.Before(time.Now())
}

func (p *refreshTokenPresenter) Invalidate() error {
    p.model.IsUsed = true
    err := p.repository.Save(p.model)
    if err != nil {
        return errors.New("failed invalidating refresh token")
    }

    return nil
}
