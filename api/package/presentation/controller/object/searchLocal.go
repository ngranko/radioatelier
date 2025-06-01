package object

import (
    "log/slog"
    "net/http"

    "radioatelier/package/adapter/auth/accessToken"
    "radioatelier/package/adapter/search/model"
    "radioatelier/package/adapter/search/repository"
    "radioatelier/package/infrastructure/logger"
    "radioatelier/package/infrastructure/router"
    "radioatelier/package/infrastructure/search"
    "radioatelier/package/infrastructure/transformations"
)

type SearchPayloadData = model.SearchResults

func SearchLocal(w http.ResponseWriter, r *http.Request) {
    token := r.Context().Value("Token").(accessToken.AccessToken)

    query := router.GetQueryParam(r, "query")
    latitude := router.GetQueryParam(r, "lat")
    longitude := router.GetQueryParam(r, "lng")
    offset := transformations.StringToInt(router.GetQueryParam(r, "offset"), 0)

    logger.GetZerolog().Info("local search", slog.String("query", query), slog.String("latitude", latitude), slog.String("longitude", longitude))

    repo := repository.NewSearchRepository(search.Get())

    id := token.UserID()
    localResults, err := repo.SearchLocal(query, latitude, longitude, id, offset, 20)
    if err != nil {
        router.NewResponse().WithStatus(http.StatusInternalServerError).Send(w)
        return
    }

    router.NewResponse().
        WithStatus(http.StatusOK).
        WithPayload(router.Payload{
            Data: localResults,
        }).
        Send(w)
}
