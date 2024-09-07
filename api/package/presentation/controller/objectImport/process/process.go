package process

import (
    "context"
    "log/slog"
    "time"

    "radioatelier/package/adapter/file"
    "radioatelier/package/infrastructure/logger"
    "radioatelier/package/presentation/controller/objectImport/types"
    "radioatelier/package/usecase/presenter"
)

func importObjects(ctx context.Context, ch chan message, ID string, separator rune, mappings types.ImportMappings) {
    user := ctx.Value("user").(presenter.User)

    f, err := file.Open("/tmp/" + ID)
    if err != nil {
        ch <- message{error: err}
        return
    }
    defer f.Delete()

    logger.GetZerolog().Info("importing objects", slog.String("user", user.GetModel().ID.String()), slog.String("id", ID), slog.Any("separator", separator), slog.Any("mappings", mappings))
    percentage := 0

    for {
        select {
        case <-ctx.Done():
            logger.GetZerolog().Info("context cancelled, exiting without returning generation result", slog.String("user", user.GetModel().ID.String()))
            return
        default:
            if percentage < 100 {
                percentage++
                ch <- message{percentage: percentage}
                time.Sleep(time.Second / 5)
            } else {
                ch <- message{result: &result{text: "Импортировано 30 точек из 50", errors: []string{"Строка 13: неверные координаты", "Строка 29: пустое название"}}}
                return
            }
        }
    }
}
