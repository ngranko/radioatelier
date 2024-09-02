package object

import (
    "net/http"

    "github.com/google/uuid"

    "radioatelier/package/adapter/auth/accessToken"
    "radioatelier/package/config"
    "radioatelier/package/infrastructure/router"
    "radioatelier/package/infrastructure/transformations"
    "radioatelier/package/usecase/presenter"
    "radioatelier/package/usecase/validation/validator"
)

type UpdateInput struct {
    Name            string   `json:"name" validate:"max=255"`
    Description     string   `json:"description"`
    Address         string   `json:"address" validate:"max=128"`
    City            string   `json:"city" validate:"max=64"`
    Country         string   `json:"country" validate:"max=64"`
    InstalledPeriod string   `json:"installedPeriod" validate:"max=20"`
    IsRemoved       bool     `json:"isRemoved"`
    RemovalPeriod   string   `json:"removalPeriod" validate:"max=20"`
    Source          string   `json:"source" validate:"max=0|url"`
    Image           string   `json:"image"`
    IsPublic        bool     `json:"isPublic"`
    IsVisited       bool     `json:"isVisited"`
    Rating          string   `json:"rating" validate:"max=0|oneof=1 2 3"`
    Category        Category `json:"category"`
    Tags            []Tag    `json:"tags"`
    PrivateTags     []Tag    `json:"privateTags"`
}

type UpdatePayloadData struct {
    ID              uuid.UUID `json:"id"`
    Name            string    `json:"name"`
    Description     string    `json:"description"`
    Lat             string    `json:"lat"`
    Lng             string    `json:"lng"`
    Address         string    `json:"address"`
    City            string    `json:"city"`
    Country         string    `json:"country"`
    InstalledPeriod string    `json:"installedPeriod"`
    IsRemoved       bool      `json:"isRemoved"`
    RemovalPeriod   string    `json:"removalPeriod"`
    Source          string    `json:"source"`
    Image           string    `json:"image"`
    IsPublic        bool      `json:"isPublic"`
    IsVisited       bool      `json:"isVisited"`
    Rating          string    `json:"rating"`
    Category        Category  `json:"category"`
    Tags            []Tag     `json:"tags"`
    PrivateTags     []Tag     `json:"privateTags"`
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

    object, err := presenter.GetObjectByID(objectID)
    if err != nil {
        router.NewResponse().WithStatus(http.StatusInternalServerError).Send(w)
        return
    }

    mapPoint, err := object.GetMapPoint()
    if err != nil {
        router.NewResponse().WithStatus(http.StatusInternalServerError).Send(w)
        return
    }

    mapPointModel := mapPoint.GetModel()
    mapPointModel.Address = payload.Address
    mapPointModel.City = payload.City
    mapPointModel.Country = payload.Country
    err = mapPoint.Update()
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

    if payload.Category.ID != uuid.Nil {
        objModel.CategoryID = payload.Category.ID
    }

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

    err = object.SetTags(transformations.Map(payload.Tags, func(item Tag) uuid.UUID { return item.ID }))
    if err != nil {
        router.NewResponse().WithStatus(http.StatusInternalServerError).Send(w)
        return
    }

    err = object.SetPrivateTags(transformations.Map(payload.PrivateTags, func(item Tag) uuid.UUID { return item.ID }), user)
    if err != nil {
        router.NewResponse().WithStatus(http.StatusInternalServerError).Send(w)
        return
    }

    objectUser, err := presenter.GetObjectUser(object.GetModel().ID, user.GetModel().ID)
    if err != nil {
        objectUser = presenter.NewObjectUser()
    }
    objectUserModel := objectUser.GetModel()
    objectUserModel.ObjectID = object.GetModel().ID
    objectUserModel.UserID = user.GetModel().ID
    objectUserModel.IsVisited = payload.IsVisited
    objectUserModel.Rating = payload.Rating
    if objectUserModel.ID == uuid.Nil {
        err = objectUser.Create()
    } else {
        err = objectUser.Update()
    }
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
                Lat:             mapPointModel.Latitude,
                Lng:             mapPointModel.Longitude,
                Address:         mapPointModel.Address,
                City:            mapPointModel.City,
                Country:         mapPointModel.Country,
                InstalledPeriod: objModel.InstalledPeriod,
                IsRemoved:       objModel.IsRemoved,
                RemovalPeriod:   objModel.RemovalPeriod,
                Source:          objModel.Source,
                Image:           objModel.Image,
                IsPublic:        objModel.IsPublic,
                IsVisited:       objectUserModel.IsVisited,
                Rating:          objectUserModel.Rating,
                Category:        payload.Category,
                Tags:            payload.Tags,
                PrivateTags:     payload.PrivateTags,
            },
        }).
        Send(w)
}
