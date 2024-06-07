package middleware

import (
    "context"
    "log/slog"
    "net/http"
    "strings"

    "radioatelier/package/adapter/auth/accessToken"
    "radioatelier/package/adapter/db/repository"
    "radioatelier/package/infrastructure/db"
    "radioatelier/package/infrastructure/logger"
    "radioatelier/package/infrastructure/router"
    "radioatelier/package/usecase/presenter"
)

func VerifyAccessToken(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        cookie, err := r.Cookie("jwt")
        if err != nil {
            router.NewResponse().
                WithStatus(http.StatusUnauthorized).
                WithPayload(router.Payload{Message: "Auth token not provided"}).
                Send(w)
            return
        }

        token, err := accessToken.NewFromEncoded(cookie.Value)
        if err != nil {
            router.NewResponse().
                WithStatus(http.StatusUnauthorized).
                WithPayload(router.Payload{Message: "Auth token is invalid"}).
                Send(w)
            return
        }

        err = token.Verify()
        if err != nil {
            router.NewResponse().
                WithStatus(http.StatusUnauthorized).
                WithPayload(router.Payload{Message: "Auth token is invalid"}).
                Send(w)
            return
        }

        ctx := context.WithValue(r.Context(), "Token", token)
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}

func VerifyRefreshToken(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        header := r.Header.Get("Authorization")
        if len(header) < 7 || strings.ToLower(header[0:6]) != "bearer" {
            // TODO: do I need to invalidate JWT cookie at this point?
            router.NewResponse().
                WithStatus(http.StatusUnauthorized).
                WithPayload(router.Payload{Message: "Token not provided"}).
                Send(w)
            return
        }

        token, err := presenter.FindRefreshTokenByString(header[7:])
        if err != nil {
            // TODO: do I need to invalidate JWT cookie at this point?
            router.NewResponse().
                WithStatus(http.StatusUnauthorized).
                WithPayload(router.Payload{Message: "Token not found in the database"}).
                Send(w)
            return
        }

        isValid := token.IsValid()
        if !isValid {
            // TODO: do I need to invalidate JWT cookie at this point?
            err := repository.NewRefreshTokenRepository(db.Get()).DeleteTokenFamily(token.GetModel())
            if err != nil {
                logger.GetZerolog().Error("failed to invalidate refresh token family", slog.Any("error", err))
            }
            router.NewResponse().
                WithStatus(http.StatusUnauthorized).
                WithPayload(router.Payload{Message: "Token is invalid"}).
                Send(w)
            return
        }

        ctx := context.WithValue(r.Context(), "RefreshToken", token)
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}
