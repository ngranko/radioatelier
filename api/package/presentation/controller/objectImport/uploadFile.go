package objectImport

import (
    "io"
    "log/slog"
    "net/http"
    "path/filepath"
    "strings"

    "radioatelier/package/adapter/file"
    "radioatelier/package/infrastructure/logger"
    "radioatelier/package/infrastructure/router"
)

type UploadFilePayloadData struct {
    ID string `json:"id"`
}

func UploadFile(w http.ResponseWriter, r *http.Request) {
    err := r.ParseMultipartForm(10 << 20)
    if err != nil {
        logger.GetZerolog().Error("failed parsing multipart form", slog.Any("error", err))
        router.NewResponse().WithStatus(http.StatusInternalServerError).Send(w)
        return
    }

    upload, _, err := r.FormFile("file")
    if err != nil {
        logger.GetZerolog().Error("failed retrieving an uploaded file", slog.Any("error", err))
        router.NewResponse().WithStatus(http.StatusInternalServerError).Send(w)
        return
    }
    defer func() {
        _ = upload.Close()
    }()

    mime, err := file.GetMimeType(upload)
    if err != nil {
        logger.GetZerolog().Error("failed detecting mime type of an uploaded file", slog.Any("error", err))
        router.NewResponse().WithStatus(http.StatusInternalServerError).Send(w)
        return
    }

    logger.GetZerolog().Info("detected mime type", slog.Any("mime", mime))
    if !strings.HasPrefix(mime, "text/csv") && !strings.HasPrefix(mime, "text/plain") {
        logger.GetZerolog().Error("uploaded file is not a csv", slog.Any("error", err))
        router.NewResponse().WithStatus(http.StatusBadRequest).Send(w)
        return
    }

    destination, err := file.CreateTemp()
    if err != nil {
        logger.GetZerolog().Error("failed creating a temp file", slog.Any("error", err))
        router.NewResponse().WithStatus(http.StatusInternalServerError).Send(w)
        return
    }

    fileBytes, err := io.ReadAll(upload)
    if err != nil {
        logger.GetZerolog().Error("failed reading an uploaded file", slog.Any("error", err))
        router.NewResponse().WithStatus(http.StatusInternalServerError).Send(w)
        return
    }
    _, err = destination.Write(fileBytes)
    if err != nil {
        logger.GetZerolog().Error("failed saving csv into a temp dir", slog.Any("error", err))
        router.NewResponse().WithStatus(http.StatusInternalServerError).Send(w)
        return
    }

    router.NewResponse().
        WithStatus(http.StatusOK).
        WithPayload(router.Payload{
            Data: UploadFilePayloadData{
                ID: filepath.Base(destination.GetPath()),
            }}).
        Send(w)
}
