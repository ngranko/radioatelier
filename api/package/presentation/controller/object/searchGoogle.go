package object

import (
    "net/http"

    "radioatelier/package/adapter/search/repository"
    "radioatelier/package/infrastructure/router"
    "radioatelier/package/infrastructure/search"
)

func SearchGoogle(w http.ResponseWriter, r *http.Request) {
    query := router.GetQueryParam(r, "query")
    latitude := router.GetQueryParam(r, "lat")
    longitude := router.GetQueryParam(r, "lng")
    pageToken := router.GetQueryParam(r, "token")

    repo := repository.NewSearchRepository(search.Get())

    results, err := repo.SearchGoogle(query, latitude, longitude, 20, pageToken)
    if err != nil {
        router.NewResponse().WithStatus(http.StatusInternalServerError).Send(w)
        return
    }

    router.NewResponse().
        WithStatus(http.StatusOK).
        WithPayload(router.Payload{
            Data: results,
        }).
        Send(w)
}
