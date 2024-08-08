package image

import (
    "radioatelier/package/file"
)

type Image interface {
    Resize(width, height int)
    GetWidth() int
    GetHeight() int
    Save(file file.UploadedFile) error
}
