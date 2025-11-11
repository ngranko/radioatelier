package image

import (
    "log/slog"
    "net/http"

    "radioatelier/package/infrastructure/logger"
    "radioatelier/package/infrastructure/router"
    "radioatelier/package/infrastructure/ulid"
    "radioatelier/package/usecase/fs"
)

type CreatePreviewInput struct {
    X      int `json:"x"`
    Y      int `json:"y"`
    Width  int `json:"width"`
    Height int `json:"height"`
}

type CreatePreviewPayloadData struct {
    ID         ulid.ULID `json:"id"`
    PreviewURL string    `json:"previewUrl"`
}

func CreatePreview(w http.ResponseWriter, r *http.Request) {
    imageID, err := ulid.Parse(router.GetPathParam(r, "id"))
    if err != nil {
        router.NewResponse().
            WithStatus(http.StatusBadRequest).
            WithPayload(router.Payload{Message: "Object ID not recognized"}).
            Send(w)
        return
    }

    var payload *CreatePreviewInput

    success := router.DecodeRequestParams(r, &payload)
    if !success {
        router.NewResponse().WithStatus(http.StatusBadRequest).Send(w)
        return
    }

    previewUrl, err := svc.CreatePreview(imageID, fs.Rect{
        X:      payload.X,
        Y:      payload.Y,
        Width:  payload.Width,
        Height: payload.Height,
    })
    if err != nil {
        logger.GetZerolog().Error("failed creating a preview", slog.Any("error", err))
        router.NewResponse().WithStatus(http.StatusInternalServerError).Send(w)
        return
    }

    router.NewResponse().
        WithStatus(http.StatusOK).
        WithPayload(router.Payload{
            Data: CreatePreviewPayloadData{
                ID:         imageID,
                PreviewURL: previewUrl,
            },
        }).
        Send(w)
}
