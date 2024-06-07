package city

import (
    "net/http"

    "github.com/google/uuid"

    "radioatelier/package/infrastructure/router"
    "radioatelier/package/usecase/presenter"
)

type GetListPayloadData struct {
    Cities []City `json:"cities"`
}

type City struct {
    ID      uuid.UUID `json:"id"`
    Name    string    `json:"name"`
    Country string    `json:"country"`
}

func GetList(w http.ResponseWriter, r *http.Request) {
    var cities []City
    list, err := presenter.GetCityList()
    if err != nil {
        router.NewResponse().WithStatus(http.StatusInternalServerError).Send(w)
        return
    }

    for _, city := range list {
        cities = append(cities, City{ID: city.GetModel().ID, Name: city.GetModel().Name, Country: city.GetModel().Country})
    }

    if cities == nil {
        cities = make([]City, 0)
    }

    router.NewResponse().
        WithStatus(http.StatusOK).
        WithPayload(router.Payload{
            Data: GetListPayloadData{
                Cities: cities,
            },
        }).
        Send(w)
}
