package object

import (
    "net/http"

    "radioatelier/package/adapter/auth/accessToken"
    "radioatelier/package/infrastructure/router"
    "radioatelier/package/infrastructure/ulid"
    "radioatelier/package/usecase/presenter"
)

type GetListPayloadData struct {
    Objects []ListItem `json:"objects"`
}

type ListItem struct {
    ID        ulid.ULID `json:"id"`
    Latitude  string    `json:"lat"`
    Longitude string    `json:"lng"`
    IsRemoved bool      `json:"isRemoved"`
    IsVisited bool      `json:"isVisited"`
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
        isVisited := false
        if len(object.GetModel().ObjectUser) > 0 {
            isVisited = object.GetModel().ObjectUser[0].IsVisited
        }

        objects = append(objects, ListItem{
            ID:        object.GetModel().ID,
            Latitude:  object.GetModel().MapPoint.Latitude,
            Longitude: object.GetModel().MapPoint.Longitude,
            IsRemoved: object.GetModel().IsRemoved,
            IsVisited: isVisited,
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
