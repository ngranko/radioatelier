package image

import (
    "bytes"
    "encoding/base64"
    "errors"
    "io"
    "math"
    "net/http"

    "radioatelier/package/adapter/file"
    "radioatelier/package/adapter/file/image"
)

type Image struct {
    raw image.Image
}

func NewImage(upload io.ReadSeeker) (*Image, error) {
    mimeType, err := file.GetMimeType(upload)
    if err != nil {
        return nil, err
    }

    img, err := makeRawImage(upload, mimeType)
    if err != nil {
        return nil, err
    }

    return &Image{
        raw: img,
    }, nil
}

func NewImageFromURL(url string) (*Image, error) {
    resp, err := http.Get(url)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    img, err := makeRawImage(resp.Body, resp.Header.Get("Content-Type"))
    if err != nil {
        return nil, err
    }

    return &Image{
        raw: img,
    }, nil
}

func NewImageFromBase64(encoded string) (*Image, error) {
    dec, err := base64.StdEncoding.DecodeString(encoded)
    if err != nil {
        return nil, err
    }

    img, err := makeRawImage(bytes.NewReader(dec), http.DetectContentType(dec))
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

func (i *Image) GetFormat() string {
    return i.raw.GetFormat()
}

func (i *Image) Save(path string) (file.File, error) {
    dest, err := file.Create(path)
    if err != nil {
        return nil, err
    }

    err = i.raw.Save(dest)
    if err != nil {
        return nil, err
    }

    return dest, nil
}

func makeRawImage(file io.Reader, mimeType string) (image.Image, error) {
    switch mimeType {
    case "image/jpeg":
        return image.NewJpegFile(file)
    case "image/png":
        return image.NewPngFile(file)
    default:
        return nil, errors.New("unsupported mime type")
    }
}
