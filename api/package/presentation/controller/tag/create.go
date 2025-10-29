package tag

import (
    "net/http"

    "radioatelier/package/config"
    "radioatelier/package/infrastructure/router"
    "radioatelier/package/infrastructure/ulid"
    "radioatelier/package/usecase/presenter"
    "radioatelier/package/usecase/validation/validator"
)

type CreateInput struct {
    Name string `json:"name" validate:"required,max=100"`
}

type CreatePayloadData struct {
    ID   ulid.ULID `json:"id"`
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

    tag := presenter.NewTag()
    tagModel := tag.GetModel()
    tagModel.Name = payload.Name
    err := tag.Create()
    if err != nil {
        router.NewResponse().WithStatus(http.StatusInternalServerError).Send(w)
        return
    }

    router.NewResponse().
        WithStatus(http.StatusOK).
        WithPayload(router.Payload{
            Data: CreatePayloadData{
                ID:   tagModel.ID,
                Name: tagModel.Name,
            },
        }).
        Send(w)
}
