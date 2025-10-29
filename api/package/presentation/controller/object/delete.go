package object

import (
    "net/http"

    "radioatelier/package/infrastructure/router"
    "radioatelier/package/infrastructure/ulid"
    "radioatelier/package/usecase/presenter"
)

type DeletePayloadData struct {
    ID ulid.ULID `json:"id"`
}

func Delete(w http.ResponseWriter, r *http.Request) {
    objectID, err := ulid.Parse(router.GetPathParam(r, "id"))
    if err != nil {
        router.NewResponse().
            WithStatus(http.StatusBadRequest).
            WithPayload(router.Payload{Message: "Object ID not recognized"}).
            Send(w)
        return
    }

    object, err := presenter.GetObjectByID(objectID)
    if err != nil {
        router.NewResponse().WithStatus(http.StatusInternalServerError).Send(w)
        return
    }

    err = presenter.DeleteObjectByID(objectID)
    if err != nil {
        router.NewResponse().WithStatus(http.StatusInternalServerError).Send(w)
        return
    }

    err = presenter.DeleteMapPointByID(object.GetModel().MapPointID)
    if err != nil {
        router.NewResponse().WithStatus(http.StatusInternalServerError).Send(w)
        return
    }

    router.NewResponse().
        WithStatus(http.StatusOK).
        WithPayload(router.Payload{
            Data: DeletePayloadData{
                ID: objectID,
            },
        }).
        Send(w)
}
