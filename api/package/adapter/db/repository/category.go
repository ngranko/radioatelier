package repository

import (
    "radioatelier/package/adapter/db/model"
    "radioatelier/package/infrastructure/db"
)

type categoryRepo struct {
    client *db.Client
}

type Category interface {
    Repository[model.Category]
    GetList() ([]model.Category, error)
}

func NewCategoryRepository(client *db.Client) Category {
    return &categoryRepo{
        client: client,
    }
}

func (r *categoryRepo) GetList() ([]model.Category, error) {
    var list []model.Category
    err := r.client.Model(&model.Category{}).Find(&list).Error
    return list, err
}

func (r *categoryRepo) Create(category *model.Category) error {
    return r.client.Create(category).Error
}

func (r *categoryRepo) Save(category *model.Category) error {
    return r.client.Save(category).Error
}

func (r *categoryRepo) Delete(category *model.Category) error {
    return r.client.Delete(category).Error
}
