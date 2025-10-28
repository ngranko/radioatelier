package migration

import (
    "log/slog"

    "radioatelier/package/adapter/db/migration/list"
    "radioatelier/package/adapter/db/model"
    "radioatelier/package/adapter/db/repository"
    "radioatelier/package/infrastructure/db"
    "radioatelier/package/infrastructure/logger"
)

var migrationList = []list.Migration{
    list.Migration202405230126,
    list.Migration202410302139,
    list.Migration202410310401,
    list.Migration202510280240,
}

func Run(client *db.Client) {
    updateSchema(client)
    executeMigrations(client)
}

func updateSchema(client *db.Client) {
    err := client.AutoMigrate(
        &model.Category{},
        &model.Migration{},
        &model.Object{},
        &model.RefreshToken{},
        &model.User{},
        &model.Tag{},
        &model.PrivateTag{},
        &model.MapPoint{},
        &model.ObjectUser{},
        &model.Sequence{},
    )
    if err != nil {
        logger.GetZerolog().Error("error while migrating the database", slog.Any("error", err))
        panic(1)
    }
}

func executeMigrations(client *db.Client) {
    for _, migration := range migrationList {
        err := executeMigration(client, migration)
        if err != nil {
            logger.GetZerolog().Error("error while migrating the database", slog.String("migration", migration.Version), slog.Any("error", err))
            panic(1)
        }
    }
}

func executeMigration(client *db.Client, migration list.Migration) error {
    repo := repository.NewMigrationRepository(client)
    if repo.IsApplied(migration.Version) {
        return nil
    }

    logger.GetZerolog().Info("executing migration", slog.String("migration", migration.Version))
    err := migration.Apply(client)
    if err != nil {
        return err
    }
    logger.GetZerolog().Info("migration executed successfully", slog.String("migration", migration.Version))

    _ = repo.Create(&model.Migration{
        Version: migration.Version,
    })
    return nil
}
