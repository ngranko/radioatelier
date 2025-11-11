package fs

import (
    "fmt"
    "io"
    "log/slog"
    "path/filepath"

    "radioatelier/package/adapter/db/model"
    "radioatelier/package/adapter/db/repository"
    "radioatelier/package/adapter/fs/storage"
    "radioatelier/package/config"
    "radioatelier/package/infrastructure/logger"
    "radioatelier/package/infrastructure/ulid"
    "radioatelier/package/usecase/file/image"
)

type service struct {
    repo  repository.Image
    store storage.Storage
    paths storage.PathBuilder
}

func NewService(repo repository.Image, store storage.Storage, paths storage.PathBuilder) Service {
    return &service{repo: repo, store: store, paths: paths}
}

func (s *service) Upload(originalFilename string, src io.ReadSeeker) (id ulid.ULID, url, previewURL string, err error) {
    img, err := image.NewImage(src)
    if err != nil {
        return
    }

    return s.saveImage(originalFilename, img)
}

func (s *service) UploadFromURL(originalFilename string, srcURL string) (id ulid.ULID, url, previewURL string, err error) {
    img, err := image.NewImageFromURL(srcURL)
    if err != nil {
        return
    }

    return s.saveImage(originalFilename, img)
}

func (s *service) UploadFromBase64(filenameHint string, b64 string) (id ulid.ULID, url, previewURL string, err error) {
    img, err := image.NewImageFromBase64(b64)
    if err != nil {
        return
    }

    originalFilename := fmt.Sprintf("%s.%s", filenameHint, img.GetFormat())
    return s.saveImage(originalFilename, img)
}

func (s *service) CreatePreview(id ulid.ULID, rect Rect) (previewURL string, err error) {
    dbImage, err := s.repo.GetByID(id)
    if err != nil {
        return
    }

    fullsizeFilename := filepath.Base(dbImage.Link)

    file, err := s.store.Open(s.store.Abs(fullsizeFilename))
    if err != nil {
        return "", err
    }
    defer func() { _ = file.Close() }()

    img, err := image.NewImage(file)
    if err != nil {
        return
    }

    previewFilename, err := s.savePreview(img, fullsizeFilename, &rect)
    if err != nil {
        logger.GetZerolog().Error("failed saving a preview image", slog.Any("error", err))
        return
    }

    if dbImage.PreviewLink != "" {
        _ = s.store.Remove(s.store.Abs(filepath.Base(dbImage.PreviewLink)))
    }

    dbImage.PreviewLink = s.store.ToPublicURL(filepath.ToSlash(previewFilename))
    err = s.repo.Save(dbImage)
    if err != nil {
        return "", err
    }

    return dbImage.PreviewLink, nil
}

func (s *service) Delete(id ulid.ULID) error {
    dbImage, err := s.repo.GetByID(id)
    if err != nil {
        return err
    }

    if dbImage.Link != "" {
        _ = s.store.Remove(s.store.Abs(filepath.Base(dbImage.Link)))
    }

    if dbImage.PreviewLink != "" {
        _ = s.store.Remove(s.store.Abs(filepath.Base(dbImage.PreviewLink)))
    }

    return s.repo.Delete(dbImage)
}

func (s *service) saveImage(originalFilename string, img *image.Image) (id ulid.ULID, url, previewURL string, err error) {
    fullsizeFilename, err := s.saveFullsize(img, originalFilename)
    if err != nil {
        logger.GetZerolog().Error("failed saving a fullsize image", slog.Any("error", err))
        return
    }

    img.Persist()

    previewFilename, err := s.savePreview(img, fullsizeFilename, nil)
    if err != nil {
        logger.GetZerolog().Error("failed saving a preview image", slog.Any("error", err))
        return
    }

    rec := &model.Image{}
    rec.Link = s.store.ToPublicURL(filepath.ToSlash(fullsizeFilename))
    rec.PreviewLink = s.store.ToPublicURL(filepath.ToSlash(previewFilename))
    err = s.repo.Create(rec)
    if err != nil {
        return
    }

    return rec.ID, rec.Link, rec.PreviewLink, nil
}

func (s *service) saveFullsize(img *image.Image, originalFilename string) (filename string, err error) {
    filename = s.paths.BuildOriginalFilename(originalFilename)

    img.ResizeToFit(config.Get().ImageResolutionLimit)

    file, err := img.Save(s.store.Abs(filename), false)
    if err != nil {
        return
    }
    defer func() { _ = file.Close() }()

    return filepath.Base(file.GetPath()), err
}

func (s *service) savePreview(img *image.Image, fullsizeFilename string, rect *Rect) (filename string, err error) {
    filename = s.paths.BuildPreviewFilename(fullsizeFilename)

    if rect == nil {
        img.CropCenter()
    } else {
        img.Crop(rect.X, rect.Y, rect.Width, rect.Height)
    }

    file, err := img.Save(s.store.Abs(filename), true)
    if err != nil {
        return
    }
    defer func() { _ = file.Close() }()

    return filepath.Base(file.GetPath()), err
}
