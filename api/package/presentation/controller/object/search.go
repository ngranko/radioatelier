package object

import (
    "fmt"
    "log/slog"
    "net/http"

    "github.com/google/uuid"

    "radioatelier/package/adapter/auth/accessToken"
    "radioatelier/package/adapter/google"
    "radioatelier/package/infrastructure/logger"
    "radioatelier/package/infrastructure/router"
    "radioatelier/package/usecase/presenter"
)

type SearchPayloadData struct {
    Objects []ResultItem `json:"objects"`
}

type ResultItem struct {
    ID           uuid.UUID `json:"id"`
    Name         string    `json:"name"`
    CategoryName string    `json:"categoryName"`
    Latitude     string    `json:"latitude"`
    Longitude    string    `json:"longitude"`
    Address      string    `json:"address"`
    City         string    `json:"city"`
    Country      string    `json:"country"`
}

func Search(w http.ResponseWriter, r *http.Request) {
    token := r.Context().Value("Token").(accessToken.AccessToken)

    query := router.GetQueryParam(r, "query")
    latitude := router.GetQueryParam(r, "lat")
    longitude := router.GetQueryParam(r, "lng")

    list, err := presenter.SearchObjects(query, latitude, longitude, token.UserID())
    if err != nil {
        router.NewResponse().WithStatus(http.StatusInternalServerError).Send(w)
        return
    }

    var result []ResultItem
    for _, item := range list {
        result = append(result, ResultItem{
            ID:           item.GetModel().ID,
            Name:         item.GetModel().Name,
            CategoryName: item.GetModel().Category.Name,
            Latitude:     item.GetModel().MapPoint.Latitude,
            Longitude:    item.GetModel().MapPoint.Longitude,
            Address:      item.GetModel().MapPoint.Address,
            City:         item.GetModel().MapPoint.City,
            Country:      item.GetModel().MapPoint.Country,
        })
    }

    googleResult, err := google.TextSearch(query, latitude, longitude)
    if err == nil {
        for _, item := range googleResult.Results {
            result = append(result, ResultItem{
                ID:           uuid.Nil,
                Name:         item.Name,
                CategoryName: item.Types[0],
                Latitude:     fmt.Sprintf("%f", item.Geometry.Location.Lat),
                Longitude:    fmt.Sprintf("%f", item.Geometry.Location.Lng),
                Address:      getStreetAddress(item),
                City:         google.FindAddressComponent(item.AddressComponents, "locality"),
                Country:      google.FindAddressComponent(item.AddressComponents, "country"),
            })
        }
    } else {
        logger.GetZerolog().Warn("failed to search in google", slog.Any("error", err))
    }

    logger.GetZerolog().Info("result", slog.Any("result", googleResult))

    router.NewResponse().
        WithStatus(http.StatusOK).
        WithPayload(router.Payload{
            Data: SearchPayloadData{
                Objects: result,
            },
        }).
        Send(w)
}

func getStreetAddress(place google.Place) string {
    streetAddress := google.ComposeStreetAddress(place.AddressComponents)
    if streetAddress == "" {
        return place.FormattedAddress
    }
    return streetAddress
}
