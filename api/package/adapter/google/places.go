package google

import (
    "encoding/json"
    "errors"
    "net/http"
    "net/url"

    "radioatelier/package/config"
    "radioatelier/package/infrastructure/network"
)

type TextSearchResponse struct {
    HTMLAttributions []string `json:"html_attributions"`
    NextPageToken    string   `json:"next_page_token"`
    Results          []Place  `json:"results"`
    Status           string   `json:"status"`
    ErrorMessage     string   `json:"error_message"`
    InfoMessages     []string `json:"info_messages"`
}

type Place struct {
    BusinessStatus    string             `json:"business_status"`
    AddressComponents []AddressComponent `json:"address_components"`
    FormattedAddress  string             `json:"formatted_address"`
    Geometry          struct {
        Location struct {
            Lat float64 `json:"lat"`
            Lng float64 `json:"lng"`
        } `json:"location"`
    } `json:"geometry"`
    Icon      string   `json:"icon"`
    Name      string   `json:"name"`
    PlaceID   string   `json:"place_id"`
    Reference string   `json:"reference"`
    Types     []string `json:"types"`
}

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

func TextSearch(query string, latitude string, longitude string) (TextSearchResponse, error) {
    client := network.NewClient(&http.Client{})
    response, err := client.Get("https://maps.googleapis.com/maps/api/place/textsearch/json?query="+url.QueryEscape(query)+"&location="+latitude+","+longitude+"&radius=50000&language=ru&key="+config.Get().GoogleAPIKey, network.Headers{})
    if err != nil {
        return TextSearchResponse{}, err
    }

    result := TextSearchResponse{}
    err = json.NewDecoder(response.GetBody()).Decode(&result)
    if err != nil {
        return TextSearchResponse{}, err
    }

    if len(result.ErrorMessage) > 0 {
        return TextSearchResponse{}, errors.New(result.ErrorMessage)
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
