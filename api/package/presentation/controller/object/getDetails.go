package object

import (
    "net/http"

    "github.com/google/uuid"

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
    CategoryID      uuid.UUID   `json:"categoryId"`
    Tags            []uuid.UUID `json:"tags"`
}

func GetDetails(w http.ResponseWriter, r *http.Request) {
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

    var result []uuid.UUID
    for _, tag := range tags {
        result = append(result, tag.GetModel().ID)
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
                    CategoryID:      object.GetModel().CategoryID,
                    Tags:            result,
                },
            },
        }).
        Send(w)
}
