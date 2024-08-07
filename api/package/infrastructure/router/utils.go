package router

import (
    "encoding/json"
    "log/slog"
    "net/http"

    "github.com/go-chi/chi/v5"

    "radioatelier/package/infrastructure/logger"
)

func GetPathParam(r *http.Request, name string) string {
    return chi.URLParam(r, name)
}

func DecodeRequestParams[T interface{}](w http.ResponseWriter, r *http.Request, receiver *T) bool {
    err := json.NewDecoder(r.Body).Decode(receiver)
    if err != nil {
        logger.GetZerolog().Error("error occurred while decoding request body", slog.Any("error", err))
        NewResponse().WithStatus(http.StatusInternalServerError).Send(w)
        return false
    }

    return true
}
