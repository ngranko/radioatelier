package object

import (
    "log/slog"
    "net/http"
    "strings"

    "radioatelier/package/adapter/auth/accessToken"
    "radioatelier/package/adapter/search/model"
    "radioatelier/package/adapter/search/repository"
    "radioatelier/package/infrastructure/logger"
    "radioatelier/package/infrastructure/router"
    "radioatelier/package/infrastructure/search"
    "radioatelier/package/usecase/validation/validator"
)

type SearchPreviewPayloadData = model.SearchResults

func SearchPreview(w http.ResponseWriter, r *http.Request) {
    token := r.Context().Value("Token").(accessToken.AccessToken)

    query := router.GetQueryParam(r, "query")
    latitude := router.GetQueryParam(r, "lat")
    longitude := router.GetQueryParam(r, "lng")

    logger.GetZerolog().Info("searching for", slog.String("query", query), slog.String("latitude", latitude), slog.String("longitude", longitude))
    repo := repository.NewSearchRepository(search.Get())

    if isQueryCoordinatesPair(query) {
        splitQuery := splitQueryAsCoordinates(query)
        results, err := repo.SearchCoordinates(splitQuery[0], splitQuery[1])
        if err != nil {
            logger.GetZerolog().Error("failed to search coordinates", slog.Any("error", err))
            router.NewResponse().WithStatus(http.StatusInternalServerError).Send(w)
            return
        }

        router.NewResponse().
            WithStatus(http.StatusOK).
            WithPayload(router.Payload{
                Data: results,
            }).
            Send(w)
        return
    }

    id := token.UserID()
    results, err := repo.SearchLocal(query, latitude, longitude, id, 0, 5)
    if err != nil {
        router.NewResponse().WithStatus(http.StatusInternalServerError).Send(w)
        return
    }

    googleResults, err := repo.SearchGoogle(query, latitude, longitude, 3, "")
    if err == nil {
        for index, item := range googleResults.Items {
            if index >= 2 {
                results.HasMore = true
                break
            }

            results.Items = append(results.Items, item)
        }
    } else {
        logger.GetZerolog().Warn("failed to search in google", slog.Any("error", err))
    }

    router.NewResponse().
        WithStatus(http.StatusOK).
        WithPayload(router.Payload{
            Data: results,
        }).
        Send(w)
}

func isQueryCoordinatesPair(query string) bool {
    splitQuery := splitQueryAsCoordinates(query)
    if len(splitQuery) != 2 {
        return false
    }
    isLat := validator.Get().ValidateVar(strings.Trim(splitQuery[0], " "), "required|latitude")
    isLon := validator.Get().ValidateVar(strings.Trim(splitQuery[1], " "), "required|longitude")
    return isLat.IsValid() && isLon.IsValid()
}

func splitQueryAsCoordinates(query string) []string {
    return strings.Split(query, ",")
}
