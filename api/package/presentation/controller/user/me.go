package user

import (
    "net/http"

    "github.com/google/uuid"

    "radioatelier/package/adapter/auth/accessToken"
    "radioatelier/package/infrastructure/router"
    "radioatelier/package/usecase/presenter"
)

type MePayloadData struct {
    ID    uuid.UUID `json:"id"`
    Role  string    `json:"role"`
    Email string    `json:"email"`
}

func Me(w http.ResponseWriter, r *http.Request) {
    token := r.Context().Value("Token").(accessToken.AccessToken)

    user, err := presenter.FindUserByID(token.UserID())
    if err != nil {
        router.NewResponse().
            WithStatus(http.StatusNotFound).
            WithPayload(router.Payload{Message: "User not found"}).
            Send(w)
        return
    }

    router.NewResponse().WithStatus(http.StatusOK).WithPayload(router.Payload{
        Data: MePayloadData{
            ID:    user.GetModel().ID,
            Role:  user.GetModel().Role,
            Email: user.GetModel().Email,
        },
    })
}
