package presenter

import (
    "github.com/google/uuid"

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
    Update() error
    Delete() error
    GetCategory() (Category, error)
    GetTags() ([]Tag, error)
    SetTags(tags []uuid.UUID) error
    GetPrivateTags(user User) ([]PrivateTag, error)
    SetPrivateTags(tags []uuid.UUID, user User) error
}

func NewObject() Object {
    return &objectPresenter{
        model:      &model.Object{},
        repository: repository.NewObjectRepository(db.Get()),
    }
}

func GetByID(id uuid.UUID) (Object, error) {
    repo := repository.NewObjectRepository(db.Get())
    object, err := repo.GetByID(id)
    if err != nil {
        return nil, err
    }

    return &objectPresenter{repository: repo, model: object}, nil
}

func GetObjectList(userID uuid.UUID) ([]Object, error) {
    var result []Object
    repo := repository.NewObjectRepository(db.Get())
    list, err := repo.GetList(userID)
    if err != nil {
        return nil, err
    }

    for _, objectModel := range list {
        result = append(result, &objectPresenter{repository: repo, model: &objectModel})
    }

    return result, nil
}

func DeleteByID(id uuid.UUID) error {
    return repository.NewObjectRepository(db.Get()).Delete(&model.Object{Base: model.Base{ID: id}})
}

func (p *objectPresenter) GetModel() *model.Object {
    return p.model
}

func (p *objectPresenter) Create() error {
    return p.repository.Create(p.model)
}

func (p *objectPresenter) Update() error {
    return p.repository.Save(p.model)
}

func (p *objectPresenter) Delete() error {
    return p.repository.Delete(p.model)
}

func (p *objectPresenter) GetCategory() (Category, error) {
    category, err := p.repository.GetCategory(p.model)
    if err != nil {
        return nil, err
    }

    return NewCategoryFromModel(category), nil
}

func (p *objectPresenter) GetTags() ([]Tag, error) {
    var result []Tag

    tags, err := p.repository.GetTags(p.model)
    if err != nil {
        return nil, err
    }

    for _, tag := range tags {
        result = append(result, NewTagFromModel(tag))
    }

    return result, nil
}

func (p *objectPresenter) SetTags(tags []uuid.UUID) error {
    return p.repository.SetTags(p.model, tags)
}

func (p *objectPresenter) GetPrivateTags(user User) ([]PrivateTag, error) {
    var result []PrivateTag

    tags, err := p.repository.GetPrivateTags(p.model, user.GetModel())
    if err != nil {
        return nil, err
    }

    for _, tag := range tags {
        result = append(result, NewPrivateTagFromModel(tag))
    }

    return result, nil
}

func (p *objectPresenter) SetPrivateTags(tags []uuid.UUID, user User) error {
    return p.repository.SetPrivateTags(p.model, user.GetModel(), tags)
}
