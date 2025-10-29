package presenter

import (
    "radioatelier/package/adapter/db/model"
    "radioatelier/package/adapter/db/repository"
    "radioatelier/package/infrastructure/db"
    "radioatelier/package/infrastructure/ulid"
)

type mapPointPresenter struct {
    repository repository.MapPoint
    model      *model.MapPoint
}

type MapPoint interface {
    GetModel() *model.MapPoint
    Create() error
    Update() error
    Delete() error
}

func NewMapPoint() MapPoint {
    return &mapPointPresenter{
        model:      &model.MapPoint{},
        repository: repository.NewMapPointRepository(db.Get()),
    }
}

func NewMapPointFromModel(model *model.MapPoint) MapPoint {
    return &mapPointPresenter{
        model:      model,
        repository: repository.NewMapPointRepository(db.Get()),
    }
}

func DeleteMapPointByID(id ulid.ULID) error {
    return repository.NewMapPointRepository(db.Get()).Delete(&model.MapPoint{Base: model.Base{ID: id}})
}

func (p *mapPointPresenter) GetModel() *model.MapPoint {
    return p.model
}

func (p *mapPointPresenter) Create() error {
    return p.repository.Create(p.model)
}

func (p *mapPointPresenter) Update() error {
    return p.repository.Save(p.model)
}

func (p *mapPointPresenter) Delete() error {
    return p.repository.Delete(p.model)
}
