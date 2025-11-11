package fs

import (
    "io"

    "radioatelier/package/infrastructure/ulid"
)

type Rect struct {
    X, Y, Width, Height int
}

type Config interface {
    UploadDir() string
    ImageResolutionLimit() int
}

type Service interface {
    Upload(originalFilename string, src io.ReadSeeker) (id ulid.ULID, url, previewURL string, err error)
    UploadFromURL(originalFilename string, srcURL string) (id ulid.ULID, url, previewURL string, err error)
    UploadFromBase64(filenameHint string, b64 string) (id ulid.ULID, url, previewURL string, err error)
    CreatePreview(id ulid.ULID, rect Rect) (previewURL string, err error)
    Delete(id ulid.ULID) error
}
