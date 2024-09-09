package repository

import (
    "github.com/google/uuid"

    "radioatelier/package/adapter/db/model"
    "radioatelier/package/infrastructure/db"
)

type privateTagRepo struct {
    client *db.Client
}

type PrivateTag interface {
    Repository[model.PrivateTag]
    GetList(userID uuid.UUID) ([]model.PrivateTag, error)
    GetByName(userID uuid.UUID, name string) (model.PrivateTag, error)
}

func NewPrivateTagRepository(client *db.Client) PrivateTag {
    return &privateTagRepo{
        client: client,
    }
}

func (r *privateTagRepo) GetList(userID uuid.UUID) ([]model.PrivateTag, error) {
    var list []model.PrivateTag
    err := r.client.Model(&model.PrivateTag{}).Where(&model.PrivateTag{CreatedBy: userID}).Select("id", "name").Find(&list).Error
    return list, err
}

func (r *privateTagRepo) GetByName(userID uuid.UUID, name string) (model.PrivateTag, error) {
    tag := model.PrivateTag{Name: name, CreatedBy: userID}
    err := r.client.Where(&tag).First(&tag).Error
    return tag, err
}

func (r *privateTagRepo) Create(tag *model.PrivateTag) error {
    return r.client.Create(tag).Error
}

func (r *privateTagRepo) Save(tag *model.PrivateTag) error {
    return r.client.Save(tag).Error
}

func (r *privateTagRepo) Delete(tag *model.PrivateTag) error {
    return r.client.Delete(tag).Error
}
