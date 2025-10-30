package object

import (
    "net/http"

    "radioatelier/package/config"
    "radioatelier/package/infrastructure/router"
    "radioatelier/package/infrastructure/ulid"
    "radioatelier/package/usecase/presenter"
    "radioatelier/package/usecase/validation/validator"
)

type RepositionInput struct {
    Lat string `json:"lat" validate:"required,latitude"`
    Lng string `json:"lng" validate:"required,longitude"`
}

type RepositionPayloadData struct {
    ID  ulid.ULID `json:"id"`
    Lat string    `json:"lat"`
    Lng string    `json:"lng"`
}

func Reposition(w http.ResponseWriter, r *http.Request) {
    objectID, err := ulid.Parse(router.GetPathParam(r, "id"))
    if err != nil {
        router.NewResponse().
            WithStatus(http.StatusBadRequest).
            WithPayload(router.Payload{Message: "Object ID not recognized"}).
            Send(w)
        return
    }

    var payload *RepositionInput

    success := router.DecodeRequestParams(r, &payload)
    if !success {
        router.NewResponse().WithStatus(http.StatusBadRequest).Send(w)
        return
    }

    res := validator.Get().ValidateStruct(payload)
    if !res.IsValid() {
        router.NewResponse().
            WithStatus(http.StatusUnprocessableEntity).
            WithPayload(router.Payload{
                Message: "Validation failed",
                Errors:  res.GetErrors(config.Get().ProjectLocale),
            }).
            Send(w)
        return
    }

    object, err := presenter.GetObjectByID(objectID)
    if err != nil {
        router.NewResponse().WithStatus(http.StatusInternalServerError).Send(w)
        return
    }

    mapPoint, err := object.GetMapPoint()
    if err != nil {
        router.NewResponse().WithStatus(http.StatusInternalServerError).Send(w)
        return
    }

    mapPointModel := mapPoint.GetModel()
    mapPointModel.Latitude = payload.Lat
    mapPointModel.Longitude = payload.Lng
    err = mapPoint.Update()
    if err != nil {
        router.NewResponse().WithStatus(http.StatusInternalServerError).Send(w)
        return
    }

    router.NewResponse().
        WithStatus(http.StatusOK).
        WithPayload(router.Payload{
            Data: UpdatePayloadData{
                ID:  object.GetModel().ID,
                Lat: mapPointModel.Latitude,
                Lng: mapPointModel.Longitude,
            },
        }).
        Send(w)
}
