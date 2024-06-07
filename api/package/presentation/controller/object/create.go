package object

import (
    "net/http"

    "github.com/google/uuid"

    "radioatelier/package/adapter/auth/accessToken"
    "radioatelier/package/infrastructure/router"
    "radioatelier/package/usecase/presenter"
    "radioatelier/package/usecase/validation/validator"
)

type CreateInput struct {
    Name       string    `json:"name" validate:"required,max=255"`
    Lat        string    `json:"lat" validate:"required"`
    Lng        string    `json:"lng" validate:"required"`
    CategoryID uuid.UUID `json:"categoryId" validate:"required,uuid"`
}

type CreatePayloadData struct {
    ID         uuid.UUID `json:"id"`
    Name       string    `json:"name"`
    Lat        string    `json:"lat"`
    Lng        string    `json:"lng"`
    CategoryID uuid.UUID `json:"categoryId"`
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

    token := r.Context().Value("Token").(accessToken.AccessToken)
    user, err := presenter.FindUserByID(token.UserID())
    if err != nil {
        router.NewResponse().
            WithStatus(http.StatusNotFound).
            WithPayload(router.Payload{Message: "User not found"}).
            Send(w)
        return
    }

    obj := presenter.NewObject()
    objModel := obj.GetModel()
    objModel.Name = payload.Name
    objModel.Latitude = payload.Lat
    objModel.Longitude = payload.Lng
    objModel.CategoryID = payload.CategoryID
    objModel.CreatedBy = user.GetModel().ID
    objModel.Creator = *user.GetModel()
    err = obj.Create()
    if err != nil {
        router.NewResponse().WithStatus(http.StatusInternalServerError).Send(w)
        return
    }

    router.NewResponse().
        WithStatus(http.StatusOK).
        WithPayload(router.Payload{
            Data: CreatePayloadData{
                ID:   objModel.ID,
                Name: objModel.Name,
                Lat:  objModel.Latitude,
                Lng:  objModel.Longitude,
            },
        }).
        Send(w)
}
