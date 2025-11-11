package image

import (
    "log/slog"
    "net/http"

    "radioatelier/package/infrastructure/logger"
    "radioatelier/package/infrastructure/router"
    "radioatelier/package/infrastructure/ulid"
)

type UploadImagePayloadData struct {
    ID         ulid.ULID `json:"id"`
    URL        string    `json:"url"`
    PreviewURL string    `json:"previewUrl"`
}

func UploadImage(w http.ResponseWriter, r *http.Request) {
    err := r.ParseMultipartForm(10 << 20)
    if err != nil {
        logger.GetZerolog().Error("failed parsing multipart form", slog.Any("error", err))
        router.NewResponse().WithStatus(http.StatusInternalServerError).Send(w)
        return
    }

    upload, header, err := r.FormFile("file")
    if err != nil {
        logger.GetZerolog().Error("failed retrieving an uploaded file", slog.Any("error", err))
        router.NewResponse().WithStatus(http.StatusInternalServerError).Send(w)
        return
    }
    defer func() { _ = upload.Close() }()

    id, url, previewURL, err := svc.Upload(header.Filename, upload)
    if err != nil {
        logger.GetZerolog().Error("failed uploading an image", slog.Any("error", err))
        router.NewResponse().WithStatus(http.StatusInternalServerError).Send(w)
        return
    }

    router.NewResponse().
        WithStatus(http.StatusOK).
        WithPayload(router.Payload{
            Data: UploadImagePayloadData{
                ID:         id,
                URL:        url,
                PreviewURL: previewURL,
            },
        }).
        Send(w)
}
