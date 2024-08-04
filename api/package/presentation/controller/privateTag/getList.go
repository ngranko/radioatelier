package privateTag

import (
    "net/http"

    "github.com/google/uuid"

    "radioatelier/package/adapter/auth/accessToken"
    "radioatelier/package/infrastructure/router"
    "radioatelier/package/usecase/presenter"
)

type GetListPayloadData struct {
    Tags []PrivateTag `json:"tags"`
}

type PrivateTag struct {
    ID   uuid.UUID `json:"id"`
    Name string    `json:"name"`
}

func GetList(w http.ResponseWriter, r *http.Request) {
    token := r.Context().Value("Token").(accessToken.AccessToken)
    user, err := presenter.FindUserByID(token.UserID())
    if err != nil {
        router.NewResponse().
            WithStatus(http.StatusNotFound).
            WithPayload(router.Payload{Message: "User not found"}).
            Send(w)
        return
    }

    var tags []PrivateTag
    list, err := presenter.GetPrivateTagList(user)
    if err != nil {
        router.NewResponse().WithStatus(http.StatusInternalServerError).Send(w)
        return
    }

    for _, tag := range list {
        tags = append(tags, PrivateTag{ID: tag.GetModel().ID, Name: tag.GetModel().Name})
    }

    if tags == nil {
        tags = make([]PrivateTag, 0)
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
