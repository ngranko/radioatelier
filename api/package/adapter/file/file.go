package file

import (
    "errors"
    "io"
    "mime/multipart"
    "net/http"
    "os"
)

type file struct {
    raw  *os.File
    path string
}

type File interface {
    GetPath() string
    GetMimeType() (string, error)
    ResetPointer() error
    Read(p []byte) (int, error)
    Write(p []byte) (int, error)
    ReadAt(p []byte, off int64) (int, error)
    Seek(offset int64, whence int) (int64, error)
    Save(contents []byte) error
    Delete() error
    Close() error
}

func CreateFile(path string) (File, error) {
    f := &file{
        path: getUniqueFilename(path),
    }

    output, err := os.Create(f.path)
    if err != nil {
        return nil, err
    }

    f.raw = output
    return f, nil
}

func CreateTempFile() (File, error) {
    f := &file{}

    output, err := os.CreateTemp("", "")
    if err != nil {
        return nil, err
    }

    f.raw = output
    f.path = output.Name()
    return f, nil
}

func Open(path string) (File, error) {
    raw, err := os.Open(path)
    if err != nil {
        return nil, err
    }

    return &file{
        raw:  raw,
        path: path,
    }, nil
}

func (f *file) Save(contents []byte) error {
    if f.raw == nil {
        return errors.New("file is not open")
    }

    _, err := f.Write(contents)
    if err != nil {
        return err
    }

    return nil
}

func (f *file) ResetPointer() error {
    if f.raw == nil {
        return errors.New("file is not open")
    }

    _, err := f.Seek(0, io.SeekStart)
    if err != nil {
        return err
    }

    return nil
}

func (f *file) Read(p []byte) (int, error) {
    return f.raw.Read(p)
}

func (f *file) Write(contents []byte) (int, error) {
    return f.raw.Write(contents)
}

func (f *file) ReadAt(p []byte, off int64) (int, error) {
    return f.raw.ReadAt(p, off)
}

func (f *file) Seek(offset int64, whence int) (int64, error) {
    return f.raw.Seek(offset, whence)
}

func (f *file) Close() error {
    if f.raw != nil {
        err := f.raw.Close()
        if err != nil {
            return err
        }

        f.raw = nil
    }

    return nil
}

func (f *file) Delete() error {
    err := f.Close()
    if err != nil {
        return err
    }
    return os.Remove(f.path)
}

func (f *file) GetPath() string {
    return f.path
}

func (f *file) GetMimeType() (string, error) {
    return GetMimeType(f.raw)
}

func GetMimeType(contents multipart.File) (string, error) {
    fileHeader := make([]byte, 512)

    _, err := contents.Read(fileHeader)
    if err != nil {
        return "", err
    }

    _, err = contents.Seek(0, io.SeekStart)
    if err != nil {
        return "", err
    }

    return http.DetectContentType(fileHeader), nil
}
