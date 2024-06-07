package city

import (
    "net/http"

    "github.com/google/uuid"

    "radioatelier/package/infrastructure/router"
    "radioatelier/package/usecase/presenter"
    "radioatelier/package/usecase/validation/validator"
)

type CreateInput struct {
    Name    string `json:"name" validate:"required,max=100"`
    Country string `json:"country" validate:"required,max=100"`
}

type CreatePayloadData struct {
    ID      uuid.UUID `json:"id"`
    Name    string    `json:"name"`
    Country string    `json:"country"`
}

func Create(w http.ResponseWriter, r *http.Request) {
    var payload *CreateInput

    success := router.DecodeRequestParams(w, r, &payload)
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
                Errors:  res.GetErrors("ru"),
            }).
            Send(w)
        return
    }

    city := presenter.NewCity()
    cityModel := city.GetModel()
    cityModel.Name = payload.Name
    cityModel.Country = payload.Country
    err := city.Create()
    if err != nil {
        router.NewResponse().WithStatus(http.StatusInternalServerError).Send(w)
        return
    }

    router.NewResponse().
        WithStatus(http.StatusOK).
        WithPayload(router.Payload{
            Data: CreatePayloadData{
                ID:      cityModel.ID,
                Name:    cityModel.Name,
                Country: cityModel.Country,
            },
        }).
        Send(w)
}
