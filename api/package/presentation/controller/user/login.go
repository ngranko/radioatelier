package user

import (
    "log/slog"
    "net/http"

    "radioatelier/package/infrastructure/logger"
    "radioatelier/package/infrastructure/router"
    "radioatelier/package/usecase/presenter"
    "radioatelier/package/usecase/session"
    "radioatelier/package/usecase/validation/validator"
)

type LogInInput struct {
    Email    string `json:"email" validate:"required,max=100,email"`
    Password string `json:"password" validate:"required"`
}

type LogInPayloadData struct {
    RefreshToken string `json:"refreshToken"`
}

func LogIn(w http.ResponseWriter, r *http.Request) {
    var payload *LogInInput

    success := router.DecodeRequestParams(r, &payload)
    if !success {
        router.NewResponse().WithStatus(http.StatusBadRequest).Send(w)
        return
    }

    res := validator.Get().ValidateStruct(payload)
    if !res.IsValid() {
        router.NewResponse().
            WithStatus(http.StatusUnprocessableEntity).
            WithPayload(router.Payload{
                Message: "Validation failed",
                Errors:  res.GetErrors("ru"),
            }).
            Send(w)
        return
    }

    user, err := presenter.FindUserByEmail(payload.Email)
    if err != nil {
        router.NewResponse().
            WithStatus(http.StatusNotFound).
            WithPayload(router.Payload{
                Message: err.Error(),
                Errors: map[string]string{
                    "email": "Этот email не зарегистрирован",
                },
            }).
            Send(w)
        return
    }

    err = user.ValidatePassword(payload.Password)
    if err != nil {
        router.NewResponse().
            WithStatus(http.StatusUnprocessableEntity).
            WithPayload(router.Payload{
                Message: err.Error(),
                Errors: map[string]string{
                    "password": "Неверный пароль",
                },
            }).
            Send(w)
        return
    }

    _ = user.UpdateLastLoginInfo()

    refreshToken, err := session.Create(w, user)
    if err != nil {
        logger.GetZerolog().Error("session creation failed", slog.Any("error", err))
        router.NewResponse().WithStatus(http.StatusInternalServerError).Send(w)
        return
    }

    router.NewResponse().
        WithStatus(http.StatusOK).
        WithPayload(router.Payload{
            Message: "",
            Data: LogInPayloadData{
                RefreshToken: refreshToken.GetModel().Token,
            },
        }).
        Send(w)
}
