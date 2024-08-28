package router

import (
    "radioatelier/package/infrastructure/router"
    "radioatelier/package/presentation/controller/category"
    "radioatelier/package/presentation/controller/object"
    "radioatelier/package/presentation/controller/objectImport"
    "radioatelier/package/presentation/controller/privateTag"
    "radioatelier/package/presentation/controller/tag"
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

    r.Route("/import", func(r *router.Router) {
        r.Use(middleware.VerifyAccessToken)

        r.Post("/upload", objectImport.UploadFile)
        r.Get("/preview/{id}", objectImport.GetPreview)
    })

    r.Route("/object", func(r *router.Router) {
        r.Use(middleware.VerifyAccessToken)

        r.Post("/", object.Create)
        r.Get("/list", object.GetList)
        r.Get("/{id}", object.GetDetails)
        r.Get("/address", object.GetAddress)
        r.Put("/{id}", object.Update)
        r.Put("/{id}/position", object.Reposition)
        r.Post("/{id}/image", object.UploadImage)
        r.Delete("/{id}", object.Delete)
    })

    r.Route("/tag", func(r *router.Router) {
        r.Use(middleware.VerifyAccessToken)

        r.Post("/", tag.Create)
        r.Get("/list", tag.GetList)

        r.Route("/private", func(r *router.Router) {
            r.Post("/", privateTag.Create)
            r.Get("/list", privateTag.GetList)
        })
    })

    r.Route("/token", func(r *router.Router) {
        r.Use(middleware.VerifyRefreshToken)

        r.Get("/refresh", token.Refresh)
        r.Post("/invalidate", token.Invalidate)
    })

    r.Route("/user", func(r *router.Router) {
        r.Post("/login", user.LogIn)

        //r.Post("/resetpass/code", user.SendPasswordResetLink)
        //r.Post("/resetpass/{code}", user.ResetPassword)

        r.Group(func(r *router.Router) {
            r.Use(middleware.VerifyAccessToken)

            //	r.Get("/me", user.Me)
            r.Post("/password", user.ChangePassword)
            r.Post("/logout", user.LogOut)
        })
    })

    return r
}
