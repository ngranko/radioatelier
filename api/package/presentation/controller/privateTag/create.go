package privateTag

import (
    "net/http"

    "github.com/google/uuid"

    "radioatelier/package/adapter/auth/accessToken"
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

    token := r.Context().Value("Token").(accessToken.AccessToken)
    user, err := presenter.FindUserByID(token.UserID())
    if err != nil {
        router.NewResponse().
            WithStatus(http.StatusNotFound).
            WithPayload(router.Payload{Message: "User not found"}).
            Send(w)
        return
    }

    tag := presenter.NewPrivateTag()
    tagModel := tag.GetModel()
    tagModel.Name = payload.Name
    tagModel.CreatedBy = user.GetModel().ID
    tagModel.Creator = *user.GetModel()
    err = tag.Create()
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
