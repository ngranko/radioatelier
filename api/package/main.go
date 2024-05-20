package main

import (
    "log/slog"

    "radioatelier/package/adapter/db/migration"
    "radioatelier/package/infrastructure/db"
    "radioatelier/package/infrastructure/logger"
    "radioatelier/package/presentation/router"
)

func main() {
    logger.GetZerolog().Info("migrating the database")
    migration.Run(db.Get())
    logger.GetZerolog().Info("migrations successful")

    logger.GetZerolog().Info("----------------|| Ready ||----------------")
    r := router.ConfigureRouter()
    err := r.Serve(":3000")
    if err != nil {
        logger.GetZerolog().Error("failed to start router", slog.Any("error", err))
        panic(1)
    }
}
