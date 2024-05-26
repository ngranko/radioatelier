package presenter

import (
    "radioatelier/package/adapter/db/model"
    "radioatelier/package/adapter/db/repository"
)

type cityPresenter struct {
    repository repository.City
    model      *model.City
}
