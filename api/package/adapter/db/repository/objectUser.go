package repository

import (
    "github.com/google/uuid"

    "radioatelier/package/adapter/db/model"
    "radioatelier/package/infrastructure/db"
)

type objectUserRepo struct {
    client *db.Client
}

type ObjectUser interface {
    Repository[model.ObjectUser]
    GetByObjectIDUserID(objectID uuid.UUID, userID uuid.UUID) (*model.ObjectUser, error)
}

func NewObjectUserRepository(client *db.Client) ObjectUser {
    return &objectUserRepo{
        client: client,
    }
}

func (r *objectUserRepo) Create(objectUser *model.ObjectUser) error {
    return r.client.Create(objectUser).Error
}

func (r *objectUserRepo) Save(objectUser *model.ObjectUser) error {
    return r.client.Save(objectUser).Error
}

func (r *objectUserRepo) Delete(objectUser *model.ObjectUser) error {
    return r.client.Delete(objectUser).Error
}

func (r *objectUserRepo) GetByObjectIDUserID(objectID uuid.UUID, userID uuid.UUID) (*model.ObjectUser, error) {
    var objectUser model.ObjectUser

    err := r.client.Where("object_id = ? AND user_id = ?", objectID, userID).First(&objectUser).Error
    if err != nil {
        return nil, err
    }

    return &objectUser, nil
}
