package presenter

import (
    "radioatelier/package/adapter/db/model"
    "radioatelier/package/adapter/db/repository"
    "radioatelier/package/infrastructure/db"
    "radioatelier/package/infrastructure/ulid"
)

type objectUserPresenter struct {
    repository repository.ObjectUser
    model      *model.ObjectUser
}

type ObjectUser interface {
    GetModel() *model.ObjectUser
    Create() error
    Update() error
}

func NewObjectUser() ObjectUser {
    return &objectUserPresenter{
        model:      &model.ObjectUser{},
        repository: repository.NewObjectUserRepository(db.Get()),
    }
}

func NewObjectUserFromModel(model *model.ObjectUser) ObjectUser {
    return &objectUserPresenter{
        model:      model,
        repository: repository.NewObjectUserRepository(db.Get()),
    }
}

func GetObjectUser(objectID ulid.ULID, userID ulid.ULID) (ObjectUser, error) {
    repo := repository.NewObjectUserRepository(db.Get())
    objectUser, err := repo.GetByObjectIDUserID(objectID, userID)
    if err != nil {
        return nil, err
    }
    return &objectUserPresenter{repository: repo, model: objectUser}, nil
}

func (p *objectUserPresenter) GetModel() *model.ObjectUser {
    return p.model
}

func (p *objectUserPresenter) Create() error {
    return p.repository.Create(p.model)
}

func (p *objectUserPresenter) Update() error {
    return p.repository.Save(p.model)
}
