package object

import (
    "net/http"

    "radioatelier/package/adapter/auth/accessToken"
    "radioatelier/package/infrastructure/router"
    "radioatelier/package/infrastructure/ulid"
    "radioatelier/package/usecase/presenter"
)

type GetDetailsPayloadData struct {
    Object Object `json:"object"`
}

type Object struct {
    ID              ulid.ULID `json:"id"`
    Name            string    `json:"name"`
    Description     string    `json:"description"`
    Latitude        string    `json:"lat"`
    Longitude       string    `json:"lng"`
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

func GetDetails(w http.ResponseWriter, r *http.Request) {
    token := r.Context().Value("Token").(accessToken.AccessToken)
    user, err := presenter.FindUserByID(token.UserID())
    if err != nil {
        router.NewResponse().
            WithStatus(http.StatusNotFound).
            WithPayload(router.Payload{Message: "User not found"}).
            Send(w)
        return
    }

    objectID, err := ulid.Parse(router.GetPathParam(r, "id"))
    if err != nil {
        router.NewResponse().
            WithStatus(http.StatusBadRequest).
            WithPayload(router.Payload{Message: "Object ID not recognized"}).
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

    category, err := getCategory(object)
    if err != nil {
        router.NewResponse().WithStatus(http.StatusInternalServerError).Send(w)
        return
    }

    tags, err := getTags(object)
    if err != nil {
        router.NewResponse().WithStatus(http.StatusInternalServerError).Send(w)
        return
    }

    privateTags, err := getPrivateTags(object, user)
    if err != nil {
        router.NewResponse().WithStatus(http.StatusInternalServerError).Send(w)
        return
    }

    objectUser, err := presenter.GetObjectUser(object.GetModel().ID, user.GetModel().ID)
    if err != nil {
        objectUser = presenter.NewObjectUser()
    }

    router.NewResponse().
        WithStatus(http.StatusOK).
        WithPayload(router.Payload{
            Data: GetDetailsPayloadData{
                Object: Object{
                    ID:              object.GetModel().ID,
                    Name:            object.GetModel().Name,
                    Description:     object.GetModel().Description,
                    Latitude:        mapPoint.GetModel().Latitude,
                    Longitude:       mapPoint.GetModel().Longitude,
                    Address:         mapPoint.GetModel().Address,
                    City:            mapPoint.GetModel().City,
                    Country:         mapPoint.GetModel().Country,
                    InstalledPeriod: object.GetModel().InstalledPeriod,
                    IsRemoved:       object.GetModel().IsRemoved,
                    RemovalPeriod:   object.GetModel().RemovalPeriod,
                    Source:          object.GetModel().Source,
                    Image:           object.GetModel().Image,
                    IsPublic:        object.GetModel().IsPublic,
                    IsVisited:       objectUser.GetModel().IsVisited,
                    Category:        category,
                    Tags:            tags,
                    PrivateTags:     privateTags,
                },
            },
        }).
        Send(w)
}
