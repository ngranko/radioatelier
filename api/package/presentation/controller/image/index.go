package image

import (
    "radioatelier/package/adapter/db/repository"
    "radioatelier/package/adapter/fs/storage"
    "radioatelier/package/config"
    "radioatelier/package/infrastructure/db"
    "radioatelier/package/usecase/fs"
)

var svc fs.Service

func init() {
    repo := repository.NewImageRepository(db.Get())
    store := storage.NewLocalStorage(config.Get().UploadDir)
    pathBuilder := storage.NewLocalPathBuilder()
    svc = fs.NewService(repo, store, pathBuilder)
}
