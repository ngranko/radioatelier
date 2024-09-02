package category

import (
    "net/http"

    "github.com/google/uuid"

    "radioatelier/package/config"
    "radioatelier/package/infrastructure/router"
    "radioatelier/package/usecase/presenter"
    "radioatelier/package/usecase/validation/validator"
)

type CreateInput struct {
    Name string `json:"name" validate:"required,max=100"`
}

type CreatePayloadData struct {
    ID   uuid.UUID `json:"id"`
    Name string    `json:"name"`
}

func Create(w http.ResponseWriter, r *http.Request) {
    var payload *CreateInput

    success := router.DecodeRequestParams(r, &payload)
    if !success {
        router.NewResponse().WithStatus(http.StatusBadRequest).Send(w)
        return
    }

    res := validator.Get().ValidateStruct(payload)
    if !res.IsValid() {
        router.NewResponse().
            WithStatus(http.StatusUnprocessableEntity).
            WithPayload(router.Payload{
                Message: "Validation failed",
                Errors:  res.GetErrors(config.Get().ProjectLocale),
            }).
            Send(w)
        return
    }

    category := presenter.NewCategory()
    categoryModel := category.GetModel()
    categoryModel.Name = payload.Name
    err := category.Create()
    if err != nil {
        router.NewResponse().WithStatus(http.StatusInternalServerError).Send(w)
        return
    }

    router.NewResponse().
        WithStatus(http.StatusOK).
        WithPayload(router.Payload{
            Data: CreatePayloadData{
                ID:   categoryModel.ID,
                Name: categoryModel.Name,
            },
        }).
        Send(w)
}
