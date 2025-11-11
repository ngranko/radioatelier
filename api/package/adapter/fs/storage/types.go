package storage

import (
    "os"
)

type Storage interface {
    Open(absPath string) (*os.File, error)
    Remove(absPath string) error
    Abs(rel string) string
    ToPublicURL(rel string) string
}

type PathBuilder interface {
    BuildOriginalFilename(originalFilename string) string
    BuildPreviewFilename(fullFilename string) string
}
