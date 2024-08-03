package presenter

import (
    "radioatelier/package/adapter/db/model"
    "radioatelier/package/adapter/db/repository"
    "radioatelier/package/infrastructure/db"
)

type tagPresenter struct {
    repository repository.Tag
    model      *model.Tag
}

type Tag interface {
    GetModel() *model.Tag
    Create() error
}

func NewTag() Tag {
    return &tagPresenter{
        model:      &model.Tag{},
        repository: repository.NewTagRepository(db.Get()),
    }
}

func NewTagFromModel(model *model.Tag) Tag {
    return &tagPresenter{
        model:      model,
        repository: repository.NewTagRepository(db.Get()),
    }
}

func GetTagList() ([]Tag, error) {
    var result []Tag
    repo := repository.NewTagRepository(db.Get())
    list, err := repo.GetList()
    if err != nil {
        return nil, err
    }

    for _, tagModel := range list {
        result = append(result, &tagPresenter{repository: repo, model: &tagModel})
    }

    return result, nil
}

func (p *tagPresenter) GetModel() *model.Tag {
    return p.model
}

func (p *tagPresenter) Create() error {
    return p.repository.Create(p.model)
}
