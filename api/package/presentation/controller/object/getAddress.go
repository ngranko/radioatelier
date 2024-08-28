package object

import (
    "encoding/json"
    "net/http"
    "slices"

    "radioatelier/package/config"
    "radioatelier/package/infrastructure/network"
    "radioatelier/package/infrastructure/router"
)

type GeocodeResponse struct {
    Results []struct {
        AddressComponents []AddressComponent `json:"address_components"`
        FormattedAddress  string             `json:"formatted_address"`
        PlaceID           string             `json:"place_id"`
    } `json:"results"`
}

type AddressComponent struct {
    LongName  string   `json:"long_name"`
    ShortName string   `json:"short_name"`
    Types     []string `json:"types"`
}

type GetAddressPayloadData struct {
    Address string `json:"address"`
    City    string `json:"city"`
    Country string `json:"country"`
}

func GetAddress(w http.ResponseWriter, r *http.Request) {
    lat := router.GetQueryParam(r, "lat")
    lng := router.GetQueryParam(r, "lng")

    client := network.NewClient(&http.Client{})
    response, err := client.Get("https://maps.googleapis.com/maps/api/geocode/json?latlng="+lat+","+lng+"&language=ru&key="+config.Get().GoogleAPIKey, network.Headers{})
    if err != nil {
        router.NewResponse().WithStatus(http.StatusInternalServerError).Send(w)
        return
    }

    result := GeocodeResponse{}
    err = json.NewDecoder(response.GetBody()).Decode(&result)
    if err != nil {
        router.NewResponse().WithStatus(http.StatusInternalServerError).Send(w)
        return
    }

    router.NewResponse().
        WithStatus(http.StatusOK).
        WithPayload(router.Payload{
            Data: GetAddressPayloadData{
                Address: composeStreetAddress(result.Results[0].AddressComponents),
                City:    findAddressComponent(result.Results[0].AddressComponents, "locality"),
                Country: findAddressComponent(result.Results[0].AddressComponents, "country"),
            },
        }).
        Send(w)
}

func findAddressComponent(components []AddressComponent, componentType string) string {
    index := slices.IndexFunc(components, func(item AddressComponent) bool {
        return slices.Contains(item.Types, componentType)
    })

    if index == -1 {
        return ""
    }
    return components[index].LongName
}

func composeStreetAddress(components []AddressComponent) string {
    streetNumber := findAddressComponent(components, "street_number")
    route := findAddressComponent(components, "route")

    if len(streetNumber) == 0 {
        return route
    }

    if len(route) == 0 {
        return streetNumber
    }

    if slices.Contains([]string{"Россия", "Беларусь", "Украина", "Казахстан"}, findAddressComponent(components, "country")) {
        return route + ", " + streetNumber
    }

    return streetNumber + " " + route
}
