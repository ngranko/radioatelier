package validation

import (
    "sync"

    "github.com/go-playground/locales/ru"
    ut "github.com/go-playground/universal-translator"
    "github.com/go-playground/validator/v10"
    ru_translations "github.com/go-playground/validator/v10/translations/ru"
)

type Params = validator.FieldLevel
type Func = func(params Params) bool

type Rule struct {
    Tag     string
    Fn      Func
    Message string
}

type validate struct {
    v   *validator.Validate
    uni *ut.UniversalTranslator
}

type Validator interface {
    RegisterRule(rule Rule) error
    CustomizeError(tag string, message string)
    ValidateStruct(s interface{}) Result
}

var once sync.Once

var v Validator

func Get() Validator {
    once.Do(func() {
        ruLocale := ru.New()
        uni := ut.New(ruLocale)

        val := validator.New()
        transRu, _ := uni.GetTranslator("ru")

        _ = ru_translations.RegisterDefaultTranslations(val, transRu)

        v = &validate{
            v:   val,
            uni: uni,
        }
    })

    return v
}

func (v *validate) RegisterRule(rule Rule) error {
    err := v.v.RegisterValidation(rule.Tag, rule.Fn)
    if err != nil {
        return err
    }
    ruTrans, _ := v.uni.GetTranslator("ru")
    v.registerMessage(rule.Tag, rule.Message, ruTrans)
    return nil
}

func (v *validate) registerMessage(tag string, message string, trans ut.Translator) {
    _ = v.v.RegisterTranslation(tag, trans,
        func(ut ut.Translator) error {
            return ut.Add(tag, message, true)
        },
        func(ut ut.Translator, fe validator.FieldError) string {
            t, _ := ut.T(tag, fe.Field())
            return t
        })
}

func (v *validate) CustomizeError(tag string, message string) {
    ruTrans, _ := v.uni.GetTranslator("ru")
    v.registerMessage(tag, message, ruTrans)
}

func (v *validate) ValidateStruct(s interface{}) Result {
    err := v.v.Struct(s)

    return result{
        ok:     err == nil,
        errors: err,
        uni:    v.uni,
    }
}
