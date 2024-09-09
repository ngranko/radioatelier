package image

import (
    "radioatelier/package/adapter/file"
)

type Image interface {
    Resize(width, height int)
    GetWidth() int
    GetHeight() int
    GetFormat() string
    Save(file file.File) error
}
