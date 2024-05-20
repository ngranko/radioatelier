package router

import (
	"net/http"

	"github.com/go-chi/chi/v5"
)

func GetPathParam(r *http.Request, name string) string {
	return chi.URLParam(r, name)
}
