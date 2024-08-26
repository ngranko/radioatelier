package image

import (
    "image"
    "image/png"
    "log/slog"
    "mime/multipart"

    "golang.org/x/image/draw"

    "radioatelier/package/adapter/file"
    "radioatelier/package/infrastructure/logger"
)

type pngFile struct {
    original image.Image
    current  *image.NRGBA
}

func NewPngFile(upload multipart.File) (Image, error) {
    src, err := png.Decode(upload)
    if err != nil {
        logger.GetZerolog().Error("failed decoding image", slog.Any("error", err))
        return nil, err
    }

    return &pngFile{
        original: src,
        current:  image.NewNRGBA(image.Rect(0, 0, src.Bounds().Max.X, src.Bounds().Max.Y)),
    }, nil
}

func (f *pngFile) Resize(width, height int) {
    f.current = image.NewNRGBA(image.Rect(0, 0, width, height))
    draw.BiLinear.Scale(f.current, f.current.Rect, f.original, f.original.Bounds(), draw.Over, nil)
}

func (f *pngFile) GetWidth() int {
    return f.original.Bounds().Max.X
}

func (f *pngFile) GetHeight() int {
    return f.original.Bounds().Max.Y
}

func (f *pngFile) Save(file file.File) error {
    return png.Encode(file, f.current)
}
