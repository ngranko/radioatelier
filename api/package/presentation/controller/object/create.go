package object

import (
    "net/http"

    "radioatelier/package/adapter/auth/accessToken"
    "radioatelier/package/config"
    "radioatelier/package/infrastructure/router"
    "radioatelier/package/infrastructure/transformations"
    "radioatelier/package/infrastructure/ulid"
    "radioatelier/package/usecase/presenter"
    "radioatelier/package/usecase/validation/validator"
)

type CreateInput struct {
    Name            string   `json:"name" validate:"required,max=255"`
    Description     string   `json:"description"`
    Lat             string   `json:"lat" validate:"required,latitude"`
    Lng             string   `json:"lng" validate:"required,longitude"`
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
    Category        Category `json:"category" validate:"required"`
    Tags            []Tag    `json:"tags"`
    PrivateTags     []Tag    `json:"privateTags"`
}

type CreatePayloadData struct {
    ID              ulid.ULID `json:"id"`
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

    mapPoint := presenter.NewMapPoint()
    mapPointModel := mapPoint.GetModel()
    mapPointModel.Latitude = payload.Lat
    mapPointModel.Longitude = payload.Lng
    mapPointModel.Address = payload.Address
    mapPointModel.City = payload.City
    mapPointModel.Country = payload.Country
    err = mapPoint.Create()
    if err != nil {
        router.NewResponse().WithStatus(http.StatusInternalServerError).Send(w)
        return
    }

    obj := presenter.NewObject()
    objModel := obj.GetModel()
    objModel.Name = payload.Name
    objModel.Description = payload.Description
    objModel.InstalledPeriod = payload.InstalledPeriod
    objModel.IsRemoved = payload.IsRemoved
    objModel.RemovalPeriod = payload.RemovalPeriod
    objModel.Source = payload.Source
    objModel.Image = payload.Image
    objModel.IsPublic = payload.IsPublic
    objModel.CategoryID = payload.Category.ID
    objModel.CreatedBy = user.GetModel().ID
    objModel.Creator = *user.GetModel()
    objModel.MapPointID = mapPointModel.ID
    objModel.MapPoint = *mapPointModel
    err = obj.Create()
    if err != nil {
        router.NewResponse().WithStatus(http.StatusInternalServerError).Send(w)
        return
    }

    err = obj.SetTags(transformations.Map(payload.Tags, func(item Tag) ulid.ULID { return item.ID }))
    if err != nil {
        router.NewResponse().WithStatus(http.StatusInternalServerError).Send(w)
        return
    }

    err = obj.SetPrivateTags(transformations.Map(payload.PrivateTags, func(item Tag) ulid.ULID { return item.ID }), user)
    if err != nil {
        router.NewResponse().WithStatus(http.StatusInternalServerError).Send(w)
        return
    }

    objectUser := presenter.NewObjectUser()
    objectUserModel := objectUser.GetModel()
    objectUserModel.ObjectID = objModel.ID
    objectUserModel.UserID = user.GetModel().ID
    objectUserModel.IsVisited = payload.IsVisited
    err = objectUser.Create()
    if err != nil {
        router.NewResponse().WithStatus(http.StatusInternalServerError).Send(w)
        return
    }

    category, _ := getCategory(obj)
    tags, _ := getTags(obj)
    privateTags, _ := getPrivateTags(obj, user)

    router.NewResponse().
        WithStatus(http.StatusOK).
        WithPayload(router.Payload{
            Data: CreatePayloadData{
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
                Category:        category,
                Tags:            tags,
                PrivateTags:     privateTags,
            },
        }).
        Send(w)
}
