package image

import (
    "image"
    "image/jpeg"
    "log/slog"
    "mime/multipart"

    "golang.org/x/image/draw"

    "radioatelier/package/adapter/file"
    "radioatelier/package/infrastructure/logger"
)

type jpegFile struct {
    original image.Image
    current  *image.RGBA
}

func NewJpegFile(upload multipart.File) (Image, error) {
    src, err := jpeg.Decode(upload)
    if err != nil {
        logger.GetZerolog().Error("failed decoding image", slog.Any("error", err))
        return nil, err
    }

    return &jpegFile{
        original: src,
        current:  image.NewRGBA(image.Rect(0, 0, src.Bounds().Max.X, src.Bounds().Max.Y)),
    }, nil
}

func (f *jpegFile) Resize(width, height int) {
    f.current = image.NewRGBA(image.Rect(0, 0, width, height))
    draw.BiLinear.Scale(f.current, f.current.Rect, f.original, f.original.Bounds(), draw.Over, nil)
}

func (f *jpegFile) GetWidth() int {
    return f.original.Bounds().Max.X
}

func (f *jpegFile) GetHeight() int {
    return f.original.Bounds().Max.Y
}

func (f *jpegFile) Save(file file.File) error {
    return jpeg.Encode(file, f.current, &jpeg.Options{Quality: 95})
}
