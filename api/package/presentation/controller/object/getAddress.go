package object

import (
    "net/http"

    "radioatelier/package/adapter/google"
    "radioatelier/package/infrastructure/router"
)

type GetAddressPayloadData struct {
    Address string `json:"address"`
    City    string `json:"city"`
    Country string `json:"country"`
}

func GetAddress(w http.ResponseWriter, r *http.Request) {
    lat := router.GetQueryParam(r, "lat")
    lng := router.GetQueryParam(r, "lng")

    result, err := google.GetAddress(lat, lng)
    if err != nil {
        router.NewResponse().WithStatus(http.StatusInternalServerError).Send(w)
        return
    }

    router.NewResponse().
        WithStatus(http.StatusOK).
        WithPayload(router.Payload{
            Data: GetAddressPayloadData{
                Address: google.ComposeStreetAddress(result.Results[0].AddressComponents),
                City:    google.FindAddressComponent(result.Results[0].AddressComponents, "locality"),
                Country: google.FindAddressComponent(result.Results[0].AddressComponents, "country"),
            },
        }).
        Send(w)
}
