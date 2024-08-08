package object

import (
    "net/http"

    "github.com/google/uuid"

    "radioatelier/package/adapter/auth/accessToken"
    "radioatelier/package/infrastructure/router"
    "radioatelier/package/usecase/presenter"
)

type GetDetailsPayloadData struct {
    Object Object `json:"object"`
}

type Object struct {
    ID              uuid.UUID   `json:"id"`
    Name            string      `json:"name"`
    Description     string      `json:"description"`
    Latitude        string      `json:"lat"`
    Longitude       string      `json:"lng"`
    Address         string      `json:"address"`
    InstalledPeriod string      `json:"installedPeriod"`
    IsRemoved       bool        `json:"isRemoved"`
    RemovalPeriod   string      `json:"removalPeriod"`
    Source          string      `json:"source"`
    Image           string      `json:"image"`
    CategoryID      uuid.UUID   `json:"categoryId"`
    Tags            []uuid.UUID `json:"tags"`
    PrivateTags     []uuid.UUID `json:"privateTags"`
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

    objectID, err := uuid.Parse(router.GetPathParam(r, "id"))
    if err != nil {
        router.NewResponse().
            WithStatus(http.StatusBadRequest).
            WithPayload(router.Payload{Message: "Object ID not recognized"}).
            Send(w)
        return
    }

    object, err := presenter.GetByID(objectID)
    if err != nil {
        router.NewResponse().WithStatus(http.StatusInternalServerError).Send(w)
        return
    }

    tags, err := object.GetTags()
    if err != nil {
        router.NewResponse().WithStatus(http.StatusInternalServerError).Send(w)
        return
    }

    var tagsResult []uuid.UUID
    for _, tag := range tags {
        tagsResult = append(tagsResult, tag.GetModel().ID)
    }

    privateTags, err := object.GetPrivateTags(user)
    if err != nil {
        router.NewResponse().WithStatus(http.StatusInternalServerError).Send(w)
        return
    }

    var privateTagsResult []uuid.UUID
    for _, privateTag := range privateTags {
        privateTagsResult = append(privateTagsResult, privateTag.GetModel().ID)
    }

    router.NewResponse().
        WithStatus(http.StatusOK).
        WithPayload(router.Payload{
            Data: GetDetailsPayloadData{
                Object: Object{
                    ID:              object.GetModel().ID,
                    Name:            object.GetModel().Name,
                    Description:     object.GetModel().Description,
                    Latitude:        object.GetModel().Latitude,
                    Longitude:       object.GetModel().Longitude,
                    Address:         object.GetModel().Address,
                    InstalledPeriod: object.GetModel().InstalledPeriod,
                    IsRemoved:       object.GetModel().IsRemoved,
                    RemovalPeriod:   object.GetModel().RemovalPeriod,
                    Source:          object.GetModel().Source,
                    Image:           object.GetModel().Image,
                    CategoryID:      object.GetModel().CategoryID,
                    Tags:            tagsResult,
                    PrivateTags:     privateTagsResult,
                },
            },
        }).
        Send(w)
}
