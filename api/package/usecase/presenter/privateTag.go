package presenter

import (
    "radioatelier/package/adapter/db/model"
    "radioatelier/package/adapter/db/repository"
    "radioatelier/package/infrastructure/db"
)

type privateTagPresenter struct {
    repository repository.PrivateTag
    model      *model.PrivateTag
}

type PrivateTag interface {
    GetModel() *model.PrivateTag
    Create() error
}

func NewPrivateTag() PrivateTag {
    return &privateTagPresenter{
        model:      &model.PrivateTag{},
        repository: repository.NewPrivateTagRepository(db.Get()),
    }
}

func NewPrivateTagFromModel(model *model.PrivateTag) PrivateTag {
    return &privateTagPresenter{
        model:      model,
        repository: repository.NewPrivateTagRepository(db.Get()),
    }
}

func GetPrivateTagList(user User) ([]PrivateTag, error) {
    var result []PrivateTag
    repo := repository.NewPrivateTagRepository(db.Get())
    list, err := repo.GetList(user.GetModel().ID)
    if err != nil {
        return nil, err
    }

    for _, privateTagModel := range list {
        result = append(result, &privateTagPresenter{repository: repo, model: &privateTagModel})
    }

    return result, nil
}

func (p *privateTagPresenter) GetModel() *model.PrivateTag {
    return p.model
}

func (p *privateTagPresenter) Create() error {
    return p.repository.Create(p.model)
}
