package repository

import (
    "radioatelier/package/adapter/db/model"
    "radioatelier/package/infrastructure/db"
)

type migrationRepo struct {
    client *db.Client
}

type Migration interface {
    Repository[model.Migration]
    IsApplied(version string) bool
}

func NewMigrationRepository(client *db.Client) Migration {
    return &migrationRepo{
        client: client,
    }
}

func (r *migrationRepo) Create(migration *model.Migration) error {
    return r.client.Create(migration).Error
}

func (r *migrationRepo) Save(migration *model.Migration) error {
    return r.client.Save(migration).Error
}

func (r *migrationRepo) Delete(migration *model.Migration) error {
    return r.client.Delete(migration).Error
}

func (r *migrationRepo) IsApplied(version string) bool {
    var count int64
    migration := model.Migration{Version: version}
    r.client.Model(&model.Migration{}).Where(&migration).Count(&count)
    return count > 0
}
