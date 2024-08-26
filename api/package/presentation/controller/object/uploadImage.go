package object

import (
    "log/slog"
    "net/http"
    "path/filepath"

    "radioatelier/package/config"
    "radioatelier/package/infrastructure/logger"
    "radioatelier/package/infrastructure/router"
    "radioatelier/package/usecase/file/image"
)

type UploadImagePayloadData struct {
    URL string `json:"url"`
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
    defer func() {
        _ = upload.Close()
    }()

    img, err := image.NewImage(upload)
    if err != nil {
        logger.GetZerolog().Error("failed creating an image", slog.Any("error", err))
        router.NewResponse().WithStatus(http.StatusInternalServerError).Send(w)
        return
    }

    img.ResizeToFit(config.Get().ImageResolutionLimit)

    dest, err := img.Save(config.Get().UploadDir + "/" + header.Filename)
    if err != nil {
        logger.GetZerolog().Error("failed writing an image", slog.Any("error", err))
        router.NewResponse().WithStatus(http.StatusInternalServerError).Send(w)
        return
    }
    defer dest.Close()

    router.NewResponse().
        WithStatus(http.StatusOK).
        WithPayload(router.Payload{
            Data: UploadImagePayloadData{
                URL: "/uploads/" + filepath.Base(dest.GetPath()),
            },
        }).
        Send(w)
}
