package router

import (
    "radioatelier/package/infrastructure/router"
    "radioatelier/package/presentation/controller/user"
)

func ConfigureRouter() *router.Router {
    r := router.NewRouter()

    r.Route("/user", func(r *router.Router) {
        r.Post("/login", user.LogIn)
        //
        //r.Post("/resetpass/code", user.SendPasswordResetLink)
        //r.Post("/resetpass/{code}", user.ResetPassword)
        //
        //r.Group(func(r *router.Router) {
        //	r.Use(middleware.VerifyAccessToken)
        //	r.Use(middleware.RequireVerifiedAccessTokenUser)
        //
        //	r.Post("/logout", user.LogOut)
        //	r.Get("/me", user.Me)
        //	r.Delete("/me", user.DeleteMe)
        //	r.Post("/password", user.ChangePassword)
        //})
    })

    return r
}
