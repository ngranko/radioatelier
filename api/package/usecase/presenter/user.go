package presenter

import (
    "errors"
    "time"

    "github.com/google/uuid"

    "radioatelier/package/adapter/db/model"
    "radioatelier/package/adapter/db/repository"
    "radioatelier/package/adapter/password"
    "radioatelier/package/infrastructure/db"
)

type userPresenter struct {
    repository repository.User
    model      *model.User
}

type User interface {
    GetModel() *model.User
    ValidatePassword(candidate string) error
    UpdatePassword(raw string) error
    UpdateLastLoginInfo() error
}

func FindUserByEmail(email string) (User, error) {
    repo := repository.NewUserRepository(db.Get())
    user, err := repo.GetByEmail(email)
    if err != nil {
        return nil, err
    }
    return &userPresenter{
        repository: repo,
        model:      user,
    }, nil
}

func FindUserByEmailWithRepo(email string, repo repository.User) (User, error) {
    user, err := repo.GetByEmail(email)
    if err != nil {
        return nil, err
    }
    return &userPresenter{
        repository: repo,
        model:      user,
    }, nil
}

func FindUserByID(id uuid.UUID) (User, error) {
    repo := repository.NewUserRepository(db.Get())
    user, err := repo.GetByID(id)
    if err != nil {
        return nil, err
    }
    return &userPresenter{
        repository: repo,
        model:      user,
    }, nil
}

func FindUserByIDWithRepo(id uuid.UUID, repo repository.User) (User, error) {
    user, err := repo.GetByID(id)
    if err != nil {
        return nil, err
    }
    return &userPresenter{
        repository: repo,
        model:      user,
    }, nil
}

func (p *userPresenter) GetModel() *model.User {
    return p.model
}

func (p *userPresenter) ValidatePassword(candidate string) error {
    pass := password.NewFromRaw(candidate)
    return pass.Verify(p.model.Password)
}

func (p *userPresenter) UpdatePassword(raw string) error {
    pass, err := password.NewFromRaw(raw).Hash()
    if err != nil {
        return err
    }

    p.model.Password = pass
    err = p.repository.Save(p.model)
    if err != nil {
        return err
    }

    return nil
}

func (p *userPresenter) UpdateLastLoginInfo() error {
    now := time.Now()
    p.model.LastLogin = &now
    err := p.repository.Save(p.model)
    if err != nil {
        return errors.New("failed updating last login info")
    }

    return nil
}
