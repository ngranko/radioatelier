package repository

import (
    "github.com/google/uuid"

    "radioatelier/package/adapter/db/model"
    "radioatelier/package/infrastructure/db"
)

type userRepo struct {
    client *db.Client
}

type User interface {
    Repository[model.User]
    IsRegistered(email string) bool
    GetByID(id uuid.UUID) (*model.User, error)
    GetByEmail(email string) (*model.User, error)
}

func NewUserRepository(client *db.Client) User {
    return &userRepo{
        client: client,
    }
}

func (r *userRepo) IsRegistered(email string) bool {
    var count int64
    r.client.Model(&model.User{}).Where("email = ?", email).Count(&count)
    return count > 0
}

func (r *userRepo) GetByID(id uuid.UUID) (*model.User, error) {
    user := model.User{Base: model.Base{ID: id}}
    err := r.client.First(&user).Error
    return &user, err
}

func (r *userRepo) GetByEmail(email string) (*model.User, error) {
    user := model.User{Email: email}
    err := r.client.Where(&user).First(&user).Error
    return &user, err
}

func (r *userRepo) Create(user *model.User) error {
    return r.client.Create(user).Error
}

func (r *userRepo) Save(user *model.User) error {
    return r.client.Save(user).Error
}

func (r *userRepo) Delete(user *model.User) error {
    return r.client.Delete(user).Error
}
