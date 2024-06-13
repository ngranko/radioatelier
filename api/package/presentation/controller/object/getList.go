package object

import (
    "net/http"

    "github.com/google/uuid"

    "radioatelier/package/infrastructure/router"
    "radioatelier/package/usecase/presenter"
)

type GetListPayloadData struct {
    Objects []ObjectListItem `json:"objects"`
}

type ObjectListItem struct {
    ID        uuid.UUID `json:"id"`
    Latitude  string    `json:"lat"`
    Longitude string    `json:"lng"`
}

func GetList(w http.ResponseWriter, r *http.Request) {
    var objects []ObjectListItem
    list, err := presenter.GetObjectList()
    if err != nil {
        router.NewResponse().WithStatus(http.StatusInternalServerError).Send(w)
        return
    }

    for _, object := range list {
        objects = append(objects, ObjectListItem{
            ID:        object.GetModel().ID,
            Latitude:  object.GetModel().Latitude,
            Longitude: object.GetModel().Longitude,
        })
    }

    if objects == nil {
        objects = make([]ObjectListItem, 0)
    }

    router.NewResponse().
        WithStatus(http.StatusOK).
        WithPayload(router.Payload{
            Data: GetListPayloadData{
                Objects: objects,
            },
        }).
        Send(w)
}
