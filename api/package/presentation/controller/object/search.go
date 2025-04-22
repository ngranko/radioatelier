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

func Search(w http.ResponseWriter, r *http.Request) {
    token := r.Context().Value("Token").(accessToken.AccessToken)

    query := router.GetQueryParam(r, "query")
    latitude := router.GetQueryParam(r, "lat")
    longitude := router.GetQueryParam(r, "lng")
    offset := transformations.StringToInt(router.GetQueryParam(r, "offset"), 0)
    pageToken := router.GetQueryParam(r, "pageToken")

    logger.GetZerolog().Info("searching for", slog.String("query", query), slog.String("latitude", latitude), slog.String("longitude", longitude))

    repo := repository.NewSearchRepository(search.Get())

    id := token.UserID()
    localResults, err := repo.SearchLocal(query, latitude, longitude, id, offset, 20)
    if err != nil {
        router.NewResponse().WithStatus(http.StatusInternalServerError).Send(w)
        return
    }

    googleResults, err := repo.SearchGoogle(query, latitude, longitude, 20, pageToken)
    if err != nil {
        logger.GetZerolog().Warn("failed to search in google", slog.Any("error", err))
    }

    router.NewResponse().
        WithStatus(http.StatusOK).
        WithPayload(router.Payload{
            Data: combineResults(localResults, googleResults),
        }).
        Send(w)
}

func combineResults(localResults model.SearchResults, googleResults model.SearchResults) model.SearchResults {
    results := model.SearchResults{}
    results.Items = append(localResults.Items, googleResults.Items...)
    results.HasMore = localResults.HasMore || googleResults.HasMore
    results.Offset = localResults.Offset
    results.NextPageToken = googleResults.NextPageToken
    return results
}
