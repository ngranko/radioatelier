package validator

import (
    "sync"

    "radioatelier/package/infrastructure/validation"
    "radioatelier/package/usecase/validation/rule"
)

var once sync.Once
var v validation.Validator

func Get() validation.Validator {
    once.Do(func() {
        v = validation.Get()

        _ = v.RegisterRule(rule.StrongPassword)
    })

    return v
}
