package router

import (
    "radioatelier/package/infrastructure/router"
    "radioatelier/package/presentation/controller/category"
    "radioatelier/package/presentation/controller/object"
    "radioatelier/package/presentation/controller/token"
    "radioatelier/package/presentation/controller/user"
    "radioatelier/package/usecase/middleware"
)

func ConfigureRouter() *router.Router {
    r := router.NewRouter()

    r.Route("/category", func(r *router.Router) {
        r.Use(middleware.VerifyAccessToken)

        r.Post("/", category.Create)
        r.Get("/list", category.GetList)
    })

    r.Route("/object", func(r *router.Router) {
        r.Use(middleware.VerifyAccessToken)

        r.Post("/", object.Create)
        r.Get("/list", object.GetList)
        r.Get("/{id}", object.GetDetails)
        r.Put("/{id}", object.Update)
        r.Put("/{id}/position", object.Reposition)
        r.Delete("/{id}", object.Delete)
    })

    r.Route("/token", func(r *router.Router) {
        r.Use(middleware.VerifyRefreshToken)

        r.Get("/refresh", token.Refresh)
        //r.Post("/invalidate", token.Invalidate)
    })

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
