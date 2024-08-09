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
    Name            string      `json:"name" validate:"max=255"`
    Description     string      `json:"description"`
    Address         string      `json:"address" validate:"max=128"`
    InstalledPeriod string      `json:"installedPeriod" validate:"max=20"`
    IsRemoved       bool        `json:"isRemoved"`
    RemovalPeriod   string      `json:"removalPeriod" validate:"max=20"`
    Source          string      `json:"source"`
    Image           string      `json:"image"`
    IsPublic        bool        `json:"isPublic"`
    CategoryID      uuid.UUID   `json:"categoryId" validate:"uuid"`
    Tags            []uuid.UUID `json:"tags"`
    PrivateTags     []uuid.UUID `json:"privateTags"`
}

type UpdatePayloadData struct {
    ID              uuid.UUID   `json:"id"`
    Name            string      `json:"name"`
    Description     string      `json:"description"`
    Lat             string      `json:"lat"`
    Lng             string      `json:"lng"`
    Address         string      `json:"address"`
    InstalledPeriod string      `json:"installedPeriod"`
    IsRemoved       bool        `json:"isRemoved"`
    RemovalPeriod   string      `json:"removalPeriod"`
    Source          string      `json:"source"`
    Image           string      `json:"image"`
    IsPublic        bool        `json:"isPublic"`
    CategoryID      uuid.UUID   `json:"categoryId"`
    Tags            []uuid.UUID `json:"tags"`
    PrivateTags     []uuid.UUID `json:"privateTags"`
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

    if len(payload.Description) > 0 {
        objModel.Description = payload.Description
    }

    if payload.CategoryID != uuid.Nil {
        objModel.CategoryID = payload.CategoryID
    }

    objModel.Address = payload.Address
    objModel.InstalledPeriod = payload.InstalledPeriod
    objModel.RemovalPeriod = payload.RemovalPeriod
    objModel.Source = payload.Source
    objModel.Image = payload.Image
    objModel.IsPublic = payload.IsPublic
    objModel.IsRemoved = payload.IsRemoved
    objModel.UpdatedBy = user.GetModel().ID
    objModel.Updater = *user.GetModel()
    err = object.Update()
    if err != nil {
        router.NewResponse().WithStatus(http.StatusInternalServerError).Send(w)
        return
    }

    err = object.SetTags(payload.Tags)
    if err != nil {
        router.NewResponse().WithStatus(http.StatusInternalServerError).Send(w)
        return
    }

    err = object.SetPrivateTags(payload.PrivateTags, user)
    if err != nil {
        router.NewResponse().WithStatus(http.StatusInternalServerError).Send(w)
        return
    }

    router.NewResponse().
        WithStatus(http.StatusOK).
        WithPayload(router.Payload{
            Data: UpdatePayloadData{
                ID:              objModel.ID,
                Name:            objModel.Name,
                Description:     objModel.Description,
                Lat:             objModel.Latitude,
                Lng:             objModel.Longitude,
                Address:         objModel.Address,
                InstalledPeriod: objModel.InstalledPeriod,
                IsRemoved:       objModel.IsRemoved,
                RemovalPeriod:   objModel.RemovalPeriod,
                Source:          objModel.Source,
                Image:           objModel.Image,
                IsPublic:        objModel.IsPublic,
                CategoryID:      objModel.CategoryID,
                Tags:            payload.Tags,
                PrivateTags:     payload.PrivateTags,
            },
        }).
        Send(w)
}
