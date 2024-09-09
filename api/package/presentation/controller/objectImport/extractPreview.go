package objectImport

import (
    "log/slog"
    "net/http"

    "radioatelier/package/config"
    "radioatelier/package/infrastructure/logger"
    "radioatelier/package/infrastructure/router"
    "radioatelier/package/usecase/file/document"
    "radioatelier/package/usecase/validation/validator"
)

type ExtractPreviewInput struct {
    ID        string `json:"id" validate:"required"`
    Separator string `json:"separator" validate:"required,max=1"`
}

type ExtractPreviewPayloadData struct {
    Preview [][]string `json:"preview"`
}

func ExtractPreview(w http.ResponseWriter, r *http.Request) {
    var payload *ExtractPreviewInput

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

    sheet, err := document.OpenCSV("/tmp/"+payload.ID, []rune(payload.Separator)[0])
    if err != nil {
        logger.GetZerolog().Error("failed opening csv", slog.Any("error", err))
        router.NewResponse().WithStatus(http.StatusInternalServerError).Send(w)
        return
    }

    preview, err := sheet.GetPreview()
    if err != nil {
        logger.GetZerolog().Error("failed getting preview", slog.Any("error", err))
        router.NewResponse().WithStatus(http.StatusInternalServerError).Send(w)
        return
    }

    router.NewResponse().
        WithStatus(http.StatusOK).
        WithPayload(router.Payload{
            Data: ExtractPreviewPayloadData{
                Preview: preview,
            }}).
        Send(w)
}
