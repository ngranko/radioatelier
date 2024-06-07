package token

import (
    //"log/slog"
    "net/http"

    //"radioatelier/package/usecase/service"

    //"radioatelier/package/infrastructure/logger"
    "radioatelier/package/infrastructure/router"
)

func Invalidate(w http.ResponseWriter, r *http.Request) {
    //token := r.Context().Value("RefreshToken").(*model.RefreshToken)
    //typedErr := service.NewRefreshTokenService().InvalidateFamily(token)
    //if typedErr != nil {
    //    logger.GetZerolog().Error("error invalidating token family", slog.Any("error", typedErr))
    //    router.NewResponse().WithStatus(http.StatusInternalServerError).Send(w)
    //    return
    //}

    router.NewResponse().WithStatus(http.StatusOK).WithPayload(router.Payload{}).Send(w)
}
