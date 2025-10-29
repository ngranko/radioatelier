package repository

import (
    "radioatelier/package/adapter/db/model"
    "radioatelier/package/infrastructure/db"
    "radioatelier/package/infrastructure/ulid"
)

type refreshTokenRepo struct {
    client *db.Client
}

type RefreshToken interface {
    Repository[model.RefreshToken]
    GetByID(id ulid.ULID) (*model.RefreshToken, error)
    GetByTokenString(tokenString string) (*model.RefreshToken, error)
    DeleteTokenFamily(token *model.RefreshToken) error
}

func NewRefreshTokenRepository(client *db.Client) RefreshToken {
    return &refreshTokenRepo{
        client: client,
    }
}

func (r *refreshTokenRepo) GetByID(id ulid.ULID) (*model.RefreshToken, error) {
    token := model.RefreshToken{Base: model.Base{ID: id}}
    err := r.client.First(&token).Error
    return &token, err
}

func (r *refreshTokenRepo) GetByTokenString(tokenString string) (*model.RefreshToken, error) {
    token := model.RefreshToken{Token: tokenString}
    err := r.client.Joins("User").Where(&token).First(&token).Error
    return &token, err
}

func (r *refreshTokenRepo) Create(token *model.RefreshToken) error {
    return r.client.Create(token).Error
}

func (r *refreshTokenRepo) Save(token *model.RefreshToken) error {
    return r.client.Save(token).Error
}

func (r *refreshTokenRepo) Delete(token *model.RefreshToken) error {
    return r.client.Delete(token).Error
}

func (r *refreshTokenRepo) DeleteTokenFamily(token *model.RefreshToken) error {
    return r.client.Where(&model.RefreshToken{Family: token.Family}).Delete(&model.RefreshToken{}).Error
}
