package tag

import (
    "net/http"

    "github.com/google/uuid"

    "radioatelier/package/infrastructure/router"
    "radioatelier/package/usecase/presenter"
)

type GetListPayloadData struct {
    Tags []Tag `json:"tags"`
}

type Tag struct {
    ID   uuid.UUID `json:"id"`
    Name string    `json:"name"`
}

func GetList(w http.ResponseWriter, r *http.Request) {
    var tags []Tag
    list, err := presenter.GetTagList()
    if err != nil {
        router.NewResponse().WithStatus(http.StatusInternalServerError).Send(w)
        return
    }

    for _, tag := range list {
        tags = append(tags, Tag{ID: tag.GetModel().ID, Name: tag.GetModel().Name})
    }

    if tags == nil {
        tags = make([]Tag, 0)
    }

    router.NewResponse().
        WithStatus(http.StatusOK).
        WithPayload(router.Payload{
            Data: GetListPayloadData{
                Tags: tags,
            },
        }).
        Send(w)
}
