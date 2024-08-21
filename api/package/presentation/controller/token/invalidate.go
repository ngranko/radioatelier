package token

import (
    "log/slog"
    //"log/slog"
    "net/http"

    //"radioatelier/package/usecase/service"

    "radioatelier/package/infrastructure/logger"
    //"radioatelier/package/infrastructure/logger"
    "radioatelier/package/infrastructure/router"
    "radioatelier/package/usecase/presenter"
)

func Invalidate(w http.ResponseWriter, r *http.Request) {
    token := r.Context().Value("RefreshToken").(presenter.RefreshToken)
    err := token.InvalidateFamily()
    if err != nil {
        logger.GetZerolog().Error("error invalidating token family", slog.Any("error", err))
        router.NewResponse().WithStatus(http.StatusInternalServerError).Send(w)
        return
    }

    router.NewResponse().WithStatus(http.StatusOK).WithPayload(router.Payload{}).Send(w)
}
