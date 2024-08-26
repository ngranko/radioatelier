package objectImport

import (
    "log/slog"
    "net/http"

    "radioatelier/package/infrastructure/logger"
    "radioatelier/package/infrastructure/router"
    "radioatelier/package/usecase/file/document"
    "radioatelier/package/usecase/validation/validator"
)

type GetPreviewInput struct {
    ID        string `json:"id" validate:"required"`
    Separator string `json:"separator" validate:"required,max=1"`
}

type GetPreviewPayloadData struct {
    Preview [][]string `json:"preview"`
}

func GetPreview(w http.ResponseWriter, r *http.Request) {
    payload := GetPreviewInput{
        ID:        router.GetPathParam(r, "id"),
        Separator: router.GetQueryParam(r, "separator"),
    }

    res := validator.Get().ValidateStruct(payload)
    if !res.IsValid() {
        router.NewResponse().
            WithStatus(http.StatusUnprocessableEntity).
            WithPayload(router.Payload{
                Message: "Validation failed",
                Errors:  res.GetErrors("ru"),
            }).
            Send(w)
        return
    }

    sheet, err := document.OpenCSV("/tmp/" + payload.ID)
    if err != nil {
        logger.GetZerolog().Error("failed opening csv", slog.Any("error", err))
        router.NewResponse().WithStatus(http.StatusInternalServerError).Send(w)
        return
    }

    preview, err := sheet.GetPreview([]rune(payload.Separator)[0])
    if err != nil {
        logger.GetZerolog().Error("failed getting preview", slog.Any("error", err))
        router.NewResponse().WithStatus(http.StatusInternalServerError).Send(w)
        return
    }

    router.NewResponse().
        WithStatus(http.StatusOK).
        WithPayload(router.Payload{
            Data: GetPreviewPayloadData{
                Preview: preview,
            }}).
        Send(w)
}
