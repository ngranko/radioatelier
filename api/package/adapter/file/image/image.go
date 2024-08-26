package image

import (
    "radioatelier/package/adapter/file"
)

type Image interface {
    Resize(width, height int)
    GetWidth() int
    GetHeight() int
    Save(file file.File) error
}
