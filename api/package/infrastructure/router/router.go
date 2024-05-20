package router

import (
    "net/http"
    "sync"

    "github.com/go-chi/chi/v5"
    "github.com/go-chi/chi/v5/middleware"
    slogchi "github.com/samber/slog-chi"

    "radioatelier/package/config"
    "radioatelier/package/infrastructure/logger"
)

type MiddlewareFunc = func(next http.Handler) http.Handler

type Router struct {
    r chi.Router
}

var once sync.Once

var r *Router

func NewRouter() *Router {
    once.Do(func() {
        r = &Router{
            r: chi.NewRouter(),
        }

        r.Use(middleware.Recoverer)

        if !config.Get().IsLive {
            r.Use(slogchi.New(logger.GetZerolog()))
        }
    })

    return r
}

func (r *Router) Use(fn func(handler http.Handler) http.Handler) {
    r.r.Use(fn)
}

func (r *Router) Child() *Router {
    return &Router{
        r: r.r.With(),
    }
}

func (r *Router) Group(fn func(r *Router)) {
    child := r.Child()
    fn(child)
}

func (r *Router) Route(pattern string, fn func(r *Router)) {
    subRouter := &Router{
        r: chi.NewRouter(),
    }
    fn(subRouter)
    r.r.Mount(pattern, subRouter.r)
}

func (r *Router) Get(pattern string, handlerFn http.HandlerFunc) {
    r.r.Get(pattern, handlerFn)
}

func (r *Router) Post(pattern string, handlerFn http.HandlerFunc) {
    r.r.Post(pattern, handlerFn)
}

func (r *Router) Put(pattern string, handlerFn http.HandlerFunc) {
    r.r.Put(pattern, handlerFn)
}

func (r *Router) Delete(pattern string, handlerFn http.HandlerFunc) {
    r.r.Delete(pattern, handlerFn)
}

func (r *Router) HandleFunc(pattern string, handlerFn http.HandlerFunc) {
    r.r.HandleFunc(pattern, handlerFn)
}

func (r *Router) Serve(port string) error {
    return http.ListenAndServe(port, r.r)
}
