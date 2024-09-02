package objectImport

import (
    "context"
    "log"
    "net/http"

    "github.com/gorilla/websocket"

    "radioatelier/package/adapter/auth/accessToken"
    "radioatelier/package/infrastructure/network/ws"
    "radioatelier/package/infrastructure/router"
    "radioatelier/package/presentation/controller/objectImport/message"
    "radioatelier/package/usecase/presenter"
)

var websocketUpgrader = websocket.Upgrader{
    ReadBufferSize:  1024,
    WriteBufferSize: 1024,
}

func StartImport(w http.ResponseWriter, r *http.Request) {
    user, typedErr := retrieveRequestUser(r)
    if typedErr != nil {
        router.NewResponse().
            WithStatus(http.StatusNotFound).
            WithPayload(router.Payload{Message: "User not found"}).
            Send(w)
        return
    }

    conn, err := websocketUpgrader.Upgrade(w, r, nil)
    if err != nil {
        log.Println(err)
        return
    }

    ctx := context.Background()
    ctx = context.WithValue(ctx, "user", user)

    client := ws.NewClient(ctx, conn, message.NewFeedbackMessageRouter())
    go client.ReadMessages()
    go client.WriteMessages()
}

func retrieveRequestUser(r *http.Request) (presenter.User, error) {
    token := r.Context().Value("Token").(accessToken.AccessToken)
    user, err := presenter.FindUserByID(token.UserID())
    if err != nil {
        return nil, err
    }
    return user, nil
}
