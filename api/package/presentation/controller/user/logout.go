package user

import (
    "net/http"

    "radioatelier/package/config"
    "radioatelier/package/infrastructure/router"
)

func LogOut(w http.ResponseWriter, r *http.Request) {
    http.SetCookie(w, &http.Cookie{
        Name:     "jwt",
        Value:    "",
        MaxAge:   -1,
        Secure:   config.Get().IsLive,
        HttpOnly: true,
        Domain:   config.Get().Host,
        Path:     "/",
    })

    http.SetCookie(w, &http.Cookie{
        Name:   "refreshToken",
        MaxAge: -1,
    })

    router.NewResponse().WithStatus(http.StatusOK).WithPayload(router.Payload{}).Send(w)
}
