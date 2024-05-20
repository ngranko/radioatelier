package router

import (
    "radioatelier/package/infrastructure/router"
)

func ConfigureRouter() *router.Router {
    r := router.NewRouter()

    r.Route("/user", func(r *router.Router) {
        //r.Post("/login", user.LogIn)
        //r.Post("/signup", user.SignUp)
        //
        //r.Post("/resetpass/code", user.SendPasswordResetLink)
        //r.Post("/resetpass/{code}", user.ResetPassword)
        //
        //r.Group(func(r *router.Router) {
        //	r.Use(middleware.VerifyAccessToken)
        //
        //	r.Post("/verify/code", user.SendVerificationLink)
        //	r.Post("/verify/{code}", user.VerifyEmail)
        //})
        //
        //r.Group(func(r *router.Router) {
        //	r.Use(middleware.VerifyAccessToken)
        //	r.Use(middleware.RequireVerifiedAccessTokenUser)
        //
        //	r.Post("/logout", user.LogOut)
        //	r.Get("/ping", user.Ping)
        //	r.Get("/me", user.Me)
        //	r.Delete("/me", user.DeleteMe)
        //	r.Post("/password", user.ChangePassword)
        //	r.Post("/onboarded", user.SetOnboarded)
        //})
    })

    return r
}
