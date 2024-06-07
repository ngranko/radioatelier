package presenter

import (
    "radioatelier/package/adapter/db/model"
    "radioatelier/package/adapter/db/repository"
    "radioatelier/package/infrastructure/db"
)

type categoryPresenter struct {
    repository repository.Category
    model      *model.Category
}

type Category interface {
    GetModel() *model.Category
    Create() error
}

func NewCategory() Category {
    return &categoryPresenter{
        model:      &model.Category{},
        repository: repository.NewCategoryRepository(db.Get()),
    }
}

func GetCategoryList() ([]Category, error) {
    var result []Category
    repo := repository.NewCategoryRepository(db.Get())
    list, err := repo.GetList()
    if err != nil {
        return nil, err
    }

    for _, categoryModel := range list {
        result = append(result, &categoryPresenter{repository: repo, model: &categoryModel})
    }

    return result, nil
}

func (p *categoryPresenter) GetModel() *model.Category {
    return p.model
}

func (p *categoryPresenter) Create() error {
    return p.repository.Create(p.model)
}
