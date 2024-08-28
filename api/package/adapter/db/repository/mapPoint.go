package repository

import (
    "radioatelier/package/adapter/db/model"
    "radioatelier/package/infrastructure/db"
)

type mapPointRepo struct {
    client *db.Client
}

type MapPoint interface {
    Repository[model.MapPoint]
    GetList() ([]model.MapPoint, error)
}

func NewMapPointRepository(client *db.Client) MapPoint {
    return &mapPointRepo{
        client: client,
    }
}

func (r *mapPointRepo) GetList() ([]model.MapPoint, error) {
    var list []model.MapPoint
    err := r.client.Model(&model.MapPoint{}).Select("id", "latitude", "longitude").Find(&list).Error
    return list, err
}

func (r *mapPointRepo) Create(mapPoint *model.MapPoint) error {
    return r.client.Create(mapPoint).Error
}

func (r *mapPointRepo) Save(mapPoint *model.MapPoint) error {
    return r.client.Save(mapPoint).Error
}

func (r *mapPointRepo) Delete(mapPoint *model.MapPoint) error {
    return r.client.Delete(mapPoint).Error
}
