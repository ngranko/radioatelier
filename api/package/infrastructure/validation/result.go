package validation

import (
    ut "github.com/go-playground/universal-translator"
    "github.com/go-playground/validator/v10"

    "radioatelier/package/infrastructure/transformations"
)

type Errors = map[string]string

type result struct {
    ok     bool
    errors error
    uni    *ut.UniversalTranslator
}

type Result interface {
    IsValid() bool
    GetErrors(lang string) Errors
}

func (r result) IsValid() bool {
    return r.ok
}

func (r result) GetErrors(lang string) Errors {
    list := Errors{}

    if r.errors != nil {
        trans, _ := r.uni.GetTranslator(lang)
        for _, err := range r.errors.(validator.ValidationErrors) {
            list[transformations.LowercaseFirst(err.Field())] = err.Translate(trans)
        }
    }

    return list
}
