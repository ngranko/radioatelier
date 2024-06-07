package token

import (
    "log/slog"
    "net/http"

    "radioatelier/package/infrastructure/logger"
    "radioatelier/package/infrastructure/router"
    "radioatelier/package/usecase/presenter"
    "radioatelier/package/usecase/session"
)

type RefreshTokenPayloadData struct {
    RefreshToken string `json:"refreshToken"`
}

func Refresh(w http.ResponseWriter, r *http.Request) {
    oldToken := r.Context().Value("RefreshToken").(presenter.RefreshToken)

    err := session.GenerateAndSetAuthToken(w, &oldToken.GetModel().User)
    if err != nil {
        logger.GetZerolog().Error("error generating new auth token", slog.Any("error", err))
        router.NewResponse().WithStatus(http.StatusInternalServerError).Send(w)
        return
    }

    newToken, typedErr := oldToken.Renew()
    if typedErr != nil {
        logger.GetZerolog().Error("error renewing refresh token", slog.Any("error", typedErr))
        router.NewResponse().WithStatus(http.StatusInternalServerError).Send(w)
        return
    }

    typedErr = oldToken.Invalidate()
    if typedErr != nil {
        logger.GetZerolog().Error("error invalidating previous refresh token", slog.Any("error", typedErr))
        router.NewResponse().WithStatus(http.StatusInternalServerError).Send(w)
        return
    }

    router.NewResponse().
        WithStatus(http.StatusOK).
        WithPayload(router.Payload{
            Message: "",
            Data: RefreshTokenPayloadData{
                RefreshToken: newToken.GetModel().Token,
            },
        }).
        Send(w)
}
