package object

import (
    "net/http"

    "github.com/google/uuid"

    "radioatelier/package/adapter/auth/accessToken"
    "radioatelier/package/infrastructure/router"
    "radioatelier/package/usecase/presenter"
    "radioatelier/package/usecase/validation/validator"
)

type UpdateInput struct {
    Name       string    `json:"name" validate:"max=255"`
    Lat        string    `json:"lat"`
    Lng        string    `json:"lng"`
    CategoryID uuid.UUID `json:"categoryId" validate:"uuid"`
}

type UpdatePayloadData struct {
    ID         uuid.UUID `json:"id"`
    Name       string    `json:"name"`
    Lat        string    `json:"lat"`
    Lng        string    `json:"lng"`
    CategoryID uuid.UUID `json:"categoryId"`
}

func Update(w http.ResponseWriter, r *http.Request) {
    objectID, err := uuid.Parse(router.GetPathParam(r, "id"))
    if err != nil {
        router.NewResponse().
            WithStatus(http.StatusBadRequest).
            WithPayload(router.Payload{Message: "Object ID not recognized"}).
            Send(w)
        return
    }

    var payload *UpdateInput

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

    object, err := presenter.GetByID(objectID)
    if err != nil {
        router.NewResponse().WithStatus(http.StatusInternalServerError).Send(w)
        return
    }

    objModel := object.GetModel()
    if len(payload.Name) > 0 {
        objModel.Name = payload.Name
    }

    if payload.CategoryID != uuid.Nil {
        objModel.CategoryID = payload.CategoryID
    }

    objModel.UpdatedBy = user.GetModel().ID
    objModel.Updater = *user.GetModel()
    err = object.Update()
    if err != nil {
        router.NewResponse().WithStatus(http.StatusInternalServerError).Send(w)
        return
    }

    router.NewResponse().
        WithStatus(http.StatusOK).
        WithPayload(router.Payload{
            Data: UpdatePayloadData{
                ID:         objModel.ID,
                Name:       objModel.Name,
                Lat:        objModel.Latitude,
                Lng:        objModel.Longitude,
                CategoryID: objModel.CategoryID,
            },
        }).
        Send(w)
}
