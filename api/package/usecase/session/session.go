package session

import (
    "log/slog"
    "net/http"

    "radioatelier/package/config"
    "radioatelier/package/infrastructure/logger"
    "radioatelier/package/usecase/presenter"
)

func Create(w http.ResponseWriter, user presenter.User) (presenter.RefreshToken, error) {
    err := GenerateAndSetAuthToken(w, user.GetModel())
    if err != nil {
        logger.GetZerolog().Error("failed to generate an auth token", slog.Any("error", err))
        return nil, err
    }

    refreshToken, err := presenter.GenerateRefreshToken(user)
    if err != nil {
        logger.GetZerolog().Error("failed to generate a refresh token", slog.Any("error", err))
        return nil, err
    }

    return refreshToken, nil
}

func Delete(w http.ResponseWriter) {
    http.SetCookie(w, &http.Cookie{
        Name:     "jwt",
        Value:    "",
        MaxAge:   -1,
        Secure:   config.Get().IsLive,
        HttpOnly: true,
        Domain:   config.Get().Host,
        Path:     "/",
    })
}
