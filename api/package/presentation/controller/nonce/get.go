package nonce

import (
    "net/http"

    "radioatelier/package/adapter/nonce"
    "radioatelier/package/infrastructure/router"
)

type GetResponseData struct {
    Nonce string `json:"nonce"`
}

func Get(w http.ResponseWriter, r *http.Request) {
    token := nonce.GetNonceStore().Create()
    router.NewResponse().
        WithStatus(http.StatusOK).
        WithPayload(router.Payload{
            Data: GetResponseData{
                Nonce: token,
            },
        }).
        Send(w)
}
