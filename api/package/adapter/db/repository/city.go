package repository

import (
    "radioatelier/package/adapter/db/model"
    "radioatelier/package/infrastructure/db"
)

type cityRepo struct {
    client *db.Client
}

type City interface {
    Repository[model.City]
    GetList() ([]model.City, error)
}

func NewCityRepository(client *db.Client) City {
    return &cityRepo{
        client: client,
    }
}

func (r *cityRepo) GetList() ([]model.City, error) {
    var list []model.City
    err := r.client.Model(&model.City{}).Find(&list).Error
    return list, err
}

func (r *cityRepo) Create(city *model.City) error {
    return r.client.Create(city).Error
}

func (r *cityRepo) Save(city *model.City) error {
    return r.client.Save(city).Error
}

func (r *cityRepo) Delete(city *model.City) error {
    return r.client.Delete(city).Error
}
