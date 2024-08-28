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

func GetQueryParam(r *http.Request, name string) string {
    return r.URL.Query().Get(name)
}

func DecodeRequestParams[T interface{}](r *http.Request, receiver *T) bool {
    err := json.NewDecoder(r.Body).Decode(receiver)
    if err != nil {
        logger.GetZerolog().Error("error occurred while decoding request body", slog.Any("error", err))
        return false
    }

    return true
}
