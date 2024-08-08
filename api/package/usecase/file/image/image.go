package image

import (
    "errors"
    "math"
    "mime/multipart"
    "net/http"

    "radioatelier/package/file"
    imageAdapter "radioatelier/package/file/image"
)

type Image struct {
    raw imageAdapter.Image
}

func NewImage(file multipart.File) (*Image, error) {
    mimeType, err := getMimeType(file)
    if err != nil {
        return nil, err
    }

    img, err := makeRawImage(file, mimeType)
    if err != nil {
        return nil, err
    }

    return &Image{
        raw: img,
    }, nil
}

func (i *Image) ResizeToFit(sizeLimit int) {
    width, height := i.getSizeInsideLimit(sizeLimit)
    i.raw.Resize(width, height)
}

func (i *Image) getSizeInsideLimit(sizeLimit int) (width, height int) {
    if int(math.Max(float64(i.raw.GetWidth()), float64(i.raw.GetHeight()))) < sizeLimit {
        return i.raw.GetWidth(), i.raw.GetHeight()
    }

    if i.raw.GetWidth() > i.raw.GetHeight() {
        return sizeLimit, i.raw.GetHeight() * sizeLimit / i.raw.GetWidth()
    }

    return i.raw.GetWidth() * sizeLimit / i.raw.GetHeight(), sizeLimit
}

func (i *Image) Save(file file.UploadedFile) error {
    return i.raw.Save(file)
}

func getMimeType(file multipart.File) (string, error) {
    fileHeader := make([]byte, 512)

    _, err := file.Read(fileHeader)
    if err != nil {
        return "", err
    }

    _, err = file.Seek(0, 0)
    if err != nil {
        return "", err
    }

    return http.DetectContentType(fileHeader), nil
}

func makeRawImage(file multipart.File, mimeType string) (imageAdapter.Image, error) {
    switch mimeType {
    case "image/jpeg":
        return imageAdapter.NewJpegFile(file)
    case "image/png":
        return imageAdapter.NewPngFile(file)
    default:
        return nil, errors.New("unsupported mime type")
    }
}
