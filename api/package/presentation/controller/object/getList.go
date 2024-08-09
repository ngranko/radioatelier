package object

import (
    "net/http"

    "github.com/google/uuid"

    "radioatelier/package/adapter/auth/accessToken"
    "radioatelier/package/infrastructure/router"
    "radioatelier/package/usecase/presenter"
)

type GetListPayloadData struct {
    Objects []ListItem `json:"objects"`
}

type ListItem struct {
    ID        uuid.UUID `json:"id"`
    Latitude  string    `json:"lat"`
    Longitude string    `json:"lng"`
}

func GetList(w http.ResponseWriter, r *http.Request) {
    token := r.Context().Value("Token").(accessToken.AccessToken)

    var objects []ListItem
    list, err := presenter.GetObjectList(token.UserID())
    if err != nil {
        router.NewResponse().WithStatus(http.StatusInternalServerError).Send(w)
        return
    }

    for _, object := range list {
        objects = append(objects, ListItem{
            ID:        object.GetModel().ID,
            Latitude:  object.GetModel().Latitude,
            Longitude: object.GetModel().Longitude,
        })
    }

    if objects == nil {
        objects = make([]ListItem, 0)
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
