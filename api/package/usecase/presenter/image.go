package presenter

import (
    "radioatelier/package/adapter/db/model"
    "radioatelier/package/adapter/db/repository"
    "radioatelier/package/infrastructure/db"
)

type imagePresenter struct {
    repository repository.Image
    model      *model.Image
}

type Image interface {
    GetModel() *model.Image
    Create() error
    Update() error
    Delete() error
}

func NewImageFromModel(model *model.Image) Image {
    return &imagePresenter{
        model:      model,
        repository: repository.NewImageRepository(db.Get()),
    }
}

func (p *imagePresenter) GetModel() *model.Image {
    return p.model
}

func (p *imagePresenter) Create() error {
    return p.repository.Create(p.model)
}

func (p *imagePresenter) Update() error {
    return p.repository.Save(p.model)
}

func (p *imagePresenter) Delete() error {
    return p.repository.Delete(p.model)
}
