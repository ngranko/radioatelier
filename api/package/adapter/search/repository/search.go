package repository

import (
    "context"
    "encoding/json"
    "fmt"
    "log/slog"
    "strconv"

    "github.com/google/uuid"
    openapi "github.com/manticoresoftware/manticoresearch-go"

    "radioatelier/package/adapter/google"
    "radioatelier/package/adapter/search/model"
    "radioatelier/package/infrastructure/logger"
    "radioatelier/package/infrastructure/search"
    "radioatelier/package/infrastructure/transformations"
)

type searchRepo struct {
    client *search.Client
}

type Search interface {
    SearchLocal(query string, latitude string, longitude string, userID uuid.UUID, offset int, limit int) (model.SearchResults, error)
    SearchGoogle(query string, latitude string, longitude string, limit int, pageToken string) (model.SearchResults, error)
    SearchCoordinates(latitude string, longitude string) (model.SearchResults, error)
}

func NewSearchRepository(client *search.Client) Search {
    return &searchRepo{
        client: client,
    }
}

func (r *searchRepo) SearchLocal(query string, latitude string, longitude string, userID uuid.UUID, offset int, limit int) (model.SearchResults, error) {
    body := fmt.Sprintf(
        "select object_id, name, address, city, country, latitude, longitude, category_name, weight() as weight, GEODIST(%f, %f, latitude, longitude, {in=degrees, out=km}) as distance from radioatelier where match('%s') and (created_by = '%s' or is_public = true) order by weight() desc, distance asc limit %d, %d",
        transformations.StringToFloat(latitude, 0),
        transformations.StringToFloat(longitude, 0),
        query,
        userID.String(),
        offset,
        limit+1,
    )

    resp, httpResp, err := search.Get().UtilsAPI.Sql(context.Background()).Body(body).RawResponse(false).Execute()
    if err != nil {
        logger.GetZerolog().Error("Error when calling `SearchAPI.Search`", slog.Any("error", err), slog.Any("full HTTP response", httpResp))
        return model.SearchResults{}, err
    }

    manticoreResults, err := parseRawManticoreResults(resp)
    if err != nil {
        logger.GetZerolog().Error("Error when parsing raw response", slog.Any("error", err), slog.Any("response", resp))
        return model.SearchResults{}, err
    }

    return convertManticoreToFinalResults(manticoreResults, offset, limit), nil
}

func (r *searchRepo) SearchGoogle(query string, latitude string, longitude string, limit int, pageToken string) (model.SearchResults, error) {
    results := model.SearchResults{}

    googleResults, err := google.TextSearch(query, latitude, longitude, limit, pageToken)
    if err != nil {
        logger.GetZerolog().Warn("failed to search in google", slog.Any("error", err))
        return model.SearchResults{}, err
    }

    for _, item := range googleResults.Places {
        results.Items = append(results.Items, model.SearchItem{
            ID:           nil,
            Name:         item.DisplayName.Text,
            CategoryName: item.PrimaryTypeDisplayName.Text,
            Latitude:     strconv.FormatFloat(item.Location.Lat, 'f', -1, 64),
            Longitude:    strconv.FormatFloat(item.Location.Lng, 'f', -1, 64),
            Address:      getStreetAddress(item),
            City:         google.FindAddressComponent(item.AddressComponents, "locality"),
            Country:      google.FindAddressComponent(item.AddressComponents, "country"),
        })
    }
    results.HasMore = googleResults.NextPageToken != ""
    results.NextPageToken = googleResults.NextPageToken

    return results, nil
}

func (r *searchRepo) SearchCoordinates(latitude string, longitude string) (model.SearchResults, error) {
    return model.SearchResults{
        Items: []model.SearchItem{{
            ID:           nil,
            Name:         "",
            CategoryName: "",
            Latitude:     latitude,
            Longitude:    longitude,
            Address:      "",
            City:         "",
            Country:      "",
        }},
    }, nil
}

func getStreetAddress(place google.Place) string {
    streetAddress := google.ComposeStreetAddress(place.AddressComponents)
    if streetAddress == "" {
        return place.FormattedAddress
    }
    return streetAddress
}

func parseRawManticoreResults(raw *openapi.SqlResponse) (model.ManticoreResults, error) {
    var manticoreResults model.ManticoreResults
    encoded, err := json.Marshal(raw)
    if err != nil {
        return model.ManticoreResults{}, err
    }
    err = json.Unmarshal(encoded, &manticoreResults)
    if err != nil {
        return model.ManticoreResults{}, err
    }

    return manticoreResults, nil
}

func convertManticoreToFinalResults(manticoreResults model.ManticoreResults, offset int, limit int) model.SearchResults {
    results := model.SearchResults{Offset: offset + limit}
    for i, hit := range manticoreResults.Hits.Hits {
        if i >= limit {
            results.HasMore = true
            break
        }

        results.Items = append(results.Items, model.SearchItem{
            ID:           &hit.Source.ObjectID,
            Name:         hit.Source.Name,
            CategoryName: hit.Source.CategoryName,
            Latitude:     strconv.FormatFloat(hit.Source.Latitude, 'f', -1, 64),
            Longitude:    strconv.FormatFloat(hit.Source.Longitude, 'f', -1, 64),
            Address:      hit.Source.Address,
            City:         hit.Source.City,
            Country:      hit.Source.Country,
        })
    }

    return results
}
