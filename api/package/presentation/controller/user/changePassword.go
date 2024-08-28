package user

import (
    "log/slog"
    "net/http"

    "radioatelier/package/adapter/auth/accessToken"
    "radioatelier/package/infrastructure/logger"
    "radioatelier/package/infrastructure/router"
    "radioatelier/package/usecase/presenter"
    "radioatelier/package/usecase/validation/validator"
)

type ChangePasswordInput struct {
    Password        string `json:"password" validate:"required,strong_password"`
    PasswordConfirm string `json:"passwordConfirm" validate:"required,eqfield=Password"`
}

func ChangePassword(w http.ResponseWriter, r *http.Request) {
    token := r.Context().Value("Token").(accessToken.AccessToken)
    var payload *ChangePasswordInput

    success := router.DecodeRequestParams(r, &payload)
    if !success {
        router.NewResponse().WithStatus(http.StatusBadRequest).Send(w)
        return
    }

    val := validator.Get()
    val.CustomizeError("eqfield", "Пароли не совпадают")
    res := val.ValidateStruct(payload)
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

    user, err := presenter.FindUserByID(token.UserID())
    if err != nil {
        router.NewResponse().
            WithStatus(http.StatusNotFound).
            WithPayload(router.Payload{Message: "User not found"}).
            Send(w)
        return
    }

    err = user.UpdatePassword(payload.Password)
    if err != nil {
        logger.GetZerolog().Error("password changing failed", slog.Any("error", err))
        router.NewResponse().WithStatus(http.StatusInternalServerError).Send(w)
        return
    }

    router.NewResponse().WithStatus(http.StatusOK).WithPayload(router.Payload{}).Send(w)
}
