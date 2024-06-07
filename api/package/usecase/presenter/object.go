package presenter

import (
    "radioatelier/package/adapter/db/model"
    "radioatelier/package/adapter/db/repository"
    "radioatelier/package/infrastructure/db"
)

type objectPresenter struct {
    repository repository.Object
    model      *model.Object
}

type Object interface {
    GetModel() *model.Object
    Create() error
}

func NewObject() Object {
    return &objectPresenter{
        model:      &model.Object{},
        repository: repository.NewObjectRepository(db.Get()),
    }
}

func GetObjectList() ([]Object, error) {
    var result []Object
    repo := repository.NewObjectRepository(db.Get())
    list, err := repo.GetList()
    if err != nil {
        return nil, err
    }

    for _, objectModel := range list {
        result = append(result, &objectPresenter{repository: repo, model: &objectModel})
    }

    return result, nil
}

func (p *objectPresenter) GetModel() *model.Object {
    return p.model
}

func (p *objectPresenter) Create() error {
    return p.repository.Create(p.model)
}
