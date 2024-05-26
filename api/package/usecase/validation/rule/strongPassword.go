package rule

import (
    "radioatelier/package/adapter/password"
    "radioatelier/package/infrastructure/validation"
)

var StrongPassword = validation.Rule{
    Tag: "strong_password",
    Fn: func(params validation.Params) bool {
        return password.NewFromRaw(params.Field().String()).IsStrong()
    },
    Message: "Слишком простой пароль",
}
