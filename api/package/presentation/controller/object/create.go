package object

import (
    "net/http"

    "github.com/google/uuid"

    "radioatelier/package/adapter/auth/accessToken"
    "radioatelier/package/infrastructure/router"
    "radioatelier/package/infrastructure/transformations"
    "radioatelier/package/usecase/presenter"
    "radioatelier/package/usecase/validation/validator"
)

type CreateInput struct {
    Name            string   `json:"name" validate:"required,max=255"`
    Description     string   `json:"description"`
    Lat             string   `json:"lat" validate:"required"`
    Lng             string   `json:"lng" validate:"required"`
    Address         string   `json:"address" validate:"max=128"`
    InstalledPeriod string   `json:"installedPeriod" validate:"max=20"`
    IsRemoved       bool     `json:"isRemoved"`
    RemovalPeriod   string   `json:"removalPeriod" validate:"max=20"`
    Source          string   `json:"source"`
    Image           string   `json:"image"`
    IsPublic        bool     `json:"isPublic"`
    Category        Category `json:"category" validate:"required"`
    Tags            []Tag    `json:"tags"`
    PrivateTags     []Tag    `json:"privateTags"`
}

type CreatePayloadData struct {
    ID              uuid.UUID `json:"id"`
    Name            string    `json:"name"`
    Description     string    `json:"description"`
    Lat             string    `json:"lat"`
    Lng             string    `json:"lng"`
    Address         string    `json:"address"`
    InstalledPeriod string    `json:"installedPeriod"`
    IsRemoved       bool      `json:"isRemoved"`
    RemovalPeriod   string    `json:"removalPeriod"`
    Source          string    `json:"source"`
    Image           string    `json:"image"`
    IsPublic        bool      `json:"isPublic"`
    Category        Category  `json:"category"`
    Tags            []Tag     `json:"tags"`
    PrivateTags     []Tag     `json:"privateTags"`
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
    objModel.Description = payload.Description
    objModel.Latitude = payload.Lat
    objModel.Longitude = payload.Lng
    objModel.Address = payload.Address
    objModel.InstalledPeriod = payload.InstalledPeriod
    objModel.IsRemoved = payload.IsRemoved
    objModel.RemovalPeriod = payload.RemovalPeriod
    objModel.Source = payload.Source
    objModel.Image = payload.Image
    objModel.IsPublic = payload.IsPublic
    objModel.CategoryID = payload.Category.ID
    objModel.CreatedBy = user.GetModel().ID
    objModel.Creator = *user.GetModel()
    objModel.UpdatedBy = user.GetModel().ID
    objModel.Updater = *user.GetModel()
    err = obj.Create()
    if err != nil {
        router.NewResponse().WithStatus(http.StatusInternalServerError).Send(w)
        return
    }

    err = obj.SetTags(transformations.Map(payload.Tags, func(item Tag) uuid.UUID { return item.ID }))
    if err != nil {
        router.NewResponse().WithStatus(http.StatusInternalServerError).Send(w)
        return
    }

    err = obj.SetPrivateTags(transformations.Map(payload.PrivateTags, func(item Tag) uuid.UUID { return item.ID }), user)
    if err != nil {
        router.NewResponse().WithStatus(http.StatusInternalServerError).Send(w)
        return
    }

    router.NewResponse().
        WithStatus(http.StatusOK).
        WithPayload(router.Payload{
            Data: CreatePayloadData{
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
                Category:        payload.Category,
                Tags:            payload.Tags,
                PrivateTags:     payload.PrivateTags,
            },
        }).
        Send(w)
}
