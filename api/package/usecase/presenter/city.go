package presenter

import (
    "radioatelier/package/adapter/db/model"
    "radioatelier/package/adapter/db/repository"
    "radioatelier/package/infrastructure/db"
)

type cityPresenter struct {
    repository repository.City
    model      *model.City
}

type City interface {
    GetModel() *model.City
    Create() error
}

func NewCity() City {
    return &cityPresenter{
        model:      &model.City{},
        repository: repository.NewCityRepository(db.Get()),
    }
}

func GetCityList() ([]City, error) {
    var result []City
    repo := repository.NewCityRepository(db.Get())
    list, err := repo.GetList()
    if err != nil {
        return nil, err
    }

    for _, cityModel := range list {
        result = append(result, &cityPresenter{repository: repo, model: &cityModel})
    }

    return result, nil
}

func (p *cityPresenter) GetModel() *model.City {
    return p.model
}

func (p *cityPresenter) Create() error {
    return p.repository.Create(p.model)
}
