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
    Cover           *Cover    `json:"cover"`
    IsPublic        bool      `json:"isPublic"`
    IsVisited       bool      `json:"isVisited"`
    Category        Category  `json:"category"`
    Tags            []Tag     `json:"tags"`
    PrivateTags     []Tag     `json:"privateTags"`
    IsOwner         bool      `json:"isOwner"`
}

func GetDetails(w http.ResponseWriter, r *http.Request) {
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

    objectResponse, err := getUserAgnosticObject(object)
    if err != nil {
        router.NewResponse().WithStatus(http.StatusInternalServerError).Send(w)
        return
    }

    token, ok := r.Context().Value("Token").(accessToken.AccessToken)
    if ok {
        objectResponse, err = fillUserDependentProps(token, object, objectResponse)
        if err != nil {
            router.NewResponse().WithStatus(http.StatusInternalServerError).Send(w)
            return
        }
    }

    router.NewResponse().
        WithStatus(http.StatusOK).
        WithPayload(router.Payload{
            Data: GetDetailsPayloadData{
                Object: objectResponse,
            },
        }).
        Send(w)
}

func getUserAgnosticObject(object presenter.Object) (Object, error) {
    mapPoint, err := object.GetMapPoint()
    if err != nil {
        return Object{}, err
    }

    category, err := getCategory(object)
    if err != nil {
        return Object{}, err
    }

    tags, err := getTags(object)
    if err != nil {
        return Object{}, err
    }

    cover, _ := getCover(object)

    return Object{
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
        Cover:           cover,
        IsPublic:        object.GetModel().IsPublic,
        Category:        category,
        Tags:            tags,
    }, nil
}

func fillUserDependentProps(token accessToken.AccessToken, object presenter.Object, objectResponse Object) (Object, error) {
    user, err := presenter.FindUserByID(token.UserID())
    if err != nil {
        return objectResponse, err
    }

    privateTags, err := getPrivateTags(object, user)
    if err != nil {
        return objectResponse, err
    }

    objectUser, err := presenter.GetObjectUser(object.GetModel().ID, user.GetModel().ID)
    if err != nil {
        objectUser = presenter.NewObjectUser()
    }

    objectResponse.PrivateTags = privateTags
    objectResponse.IsVisited = objectUser.GetModel().IsVisited
    objectResponse.IsOwner = object.GetModel().CreatedBy == user.GetModel().ID

    return objectResponse, nil
}
