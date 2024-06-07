package repository

import (
    "radioatelier/package/adapter/db/model"
    "radioatelier/package/infrastructure/db"
)

type objectRepo struct {
    client *db.Client
}

type Object interface {
    Repository[model.Object]
    GetList() ([]model.Object, error)
}

func NewObjectRepository(client *db.Client) Object {
    return &objectRepo{
        client: client,
    }
}

func (r *objectRepo) GetList() ([]model.Object, error) {
    var list []model.Object
    err := r.client.Model(&model.Object{}).Find(&list).Error
    return list, err
}

func (r *objectRepo) Create(object *model.Object) error {
    return r.client.Create(object).Error
}

func (r *objectRepo) Save(object *model.Object) error {
    return r.client.Save(object).Error
}

func (r *objectRepo) Delete(object *model.Object) error {
    return r.client.Delete(object).Error
}
