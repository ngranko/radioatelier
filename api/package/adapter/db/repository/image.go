package repository

import (
    "radioatelier/package/adapter/db/model"
    "radioatelier/package/infrastructure/db"
    "radioatelier/package/infrastructure/ulid"
)

type imageRepo struct {
    client *db.Client
}

type Image interface {
    Repository[model.Image]
    GetByID(id ulid.ULID) (*model.Image, error)
}

func NewImageRepository(client *db.Client) Image {
    return &imageRepo{
        client: client,
    }
}

func (r *imageRepo) GetByID(id ulid.ULID) (*model.Image, error) {
    image := model.Image{Base: model.Base{ID: id}}
    err := r.client.First(&image).Error
    return &image, err
}

func (r *imageRepo) Create(image *model.Image) error {
    return r.client.Create(image).Error
}

func (r *imageRepo) Save(image *model.Image) error {
    return r.client.Save(image).Error
}

func (r *imageRepo) Delete(image *model.Image) error {
    return r.client.Delete(image).Error
}
