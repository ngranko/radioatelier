package google

import (
    "encoding/json"
    "fmt"
    "net/http"
    "strings"

    "radioatelier/package/config"
    "radioatelier/package/infrastructure/network"
)

type TextSearchResponse struct {
    Places        []Place `json:"places"`
    NextPageToken string  `json:"nextPageToken"`
}

type Place struct {
    ID                     string             `json:"id"`
    DisplayName            LocalizedText      `json:"displayName"`
    Types                  []string           `json:"types"`
    PrimaryType            string             `json:"primaryType"`
    PrimaryTypeDisplayName LocalizedText      `json:"primaryTypeDisplayName"`
    FormattedAddress       string             `json:"formattedAddress"`
    AddressComponents      []AddressComponent `json:"addressComponents"`
    Location               struct {
        Lat float64 `json:"latitude"`
        Lng float64 `json:"longitude"`
    } `json:"location"`
    BusinessStatus      string `json:"businessStatus"`
    IconMaskBaseUri     string `json:"iconMaskBaseUri"`
    IconBackgroundColor string `json:"iconBackgroundColor"`
}

type LocalizedText struct {
    Text         string `json:"text"`
    LanguageCode string `json:"languageCode"`
}

type GeocodeResponse struct {
    Results []struct {
        AddressComponents []AddressComponent `json:"address_components"`
        FormattedAddress  string             `json:"formatted_address"`
        PlaceID           string             `json:"place_id"`
    } `json:"results"`
}

type AddressComponent struct {
    LongName  string   `json:"longText" json:"long_name"`
    ShortName string   `json:"shortText" json:"short_name"`
    Types     []string `json:"types"`
}

func TextSearch(query string, latitude string, longitude string, limit int, pageToken string) (TextSearchResponse, error) {
    client := network.NewClient(&http.Client{})

    body := strings.NewReader(fmt.Sprintf(`{"textQuery": "%s",
        "languageCode": "ru",
        "locationBias": {
            "circle": {
                "center": {
                    "latitude": %s,
                    "longitude": %s
                },
                "radius": 50000.0
            }
        },
        "pageSize": %d,
        "pageToken": "%s"
    }`, query, latitude, longitude, limit, pageToken))

    headers := network.Headers{
        "Content-Type":     "application/json",
        "X-Goog-Api-Key":   config.Get().GoogleAPIKey,
        "X-Goog-FieldMask": "places.id,places.displayName,places.types,places.primaryType,places.primaryTypeDisplayName,places.formattedAddress,places.addressComponents,places.location,places.businessStatus,places.iconMaskBaseUri,places.iconBackgroundColor,nextPageToken",
    }

    response, err := client.Post("https://places.googleapis.com/v1/places:searchText", body, headers)
    if err != nil {
        return TextSearchResponse{}, err
    }

    result := TextSearchResponse{}
    err = json.NewDecoder(response.GetBody()).Decode(&result)
    if err != nil {
        return TextSearchResponse{}, err
    }

    return result, nil
}

func GetAddress(latitude string, longitude string) (GeocodeResponse, error) {
    client := network.NewClient(&http.Client{})
    response, err := client.Get("https://maps.googleapis.com/maps/api/geocode/json?latlng="+latitude+","+longitude+"&language=ru&key="+config.Get().GoogleAPIKey, network.Headers{})
    if err != nil {
        return GeocodeResponse{}, err
    }

    result := GeocodeResponse{}
    err = json.NewDecoder(response.GetBody()).Decode(&result)
    if err != nil {
        return GeocodeResponse{}, err
    }

    return result, nil
}
