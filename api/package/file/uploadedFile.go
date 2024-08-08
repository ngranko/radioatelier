package file

import (
    "mime/multipart"
    "os"
    "path/filepath"
    "strconv"

    "radioatelier/package/config"
)

type uploadedFile struct {
    file     *os.File
    filename string
    size     int64
}

type UploadedFile interface {
    Create() (string, error)
    Write(p []byte) (n int, err error)
}

func NewUploadedFileFromMultipart(header *multipart.FileHeader) UploadedFile {
    return &uploadedFile{
        filename: header.Filename,
        size:     header.Size,
    }
}

func (f *uploadedFile) Create() (string, error) {
    output, err := f.createFileInUploadsDir()
    if err != nil {
        return "", err
    }

    f.file = output
    return f.file.Name(), nil
}

func (f *uploadedFile) Write(p []byte) (n int, err error) {
    return f.file.Write(p)
}

func (f *uploadedFile) createFileInUploadsDir() (*os.File, error) {
    return os.Create(f.getFilePath())
}

func (f *uploadedFile) getFilePath() string {
    return config.Get().UploadDir + "/" + f.getUniqueFilename()
}

func (f *uploadedFile) getFilename(suffix string) string {
    extension := filepath.Ext(f.filename)
    name := f.filename[:len(f.filename)-len(extension)]
    return sanitize(name+suffix) + extension
}

func (f *uploadedFile) getUniqueFilename() string {
    suffix := 0
    currentFilename := f.getFilename("")
    basePath := config.Get().UploadDir + "/"

    for fileExists(basePath + currentFilename) {
        suffix++
        currentFilename = f.getFilename(strconv.Itoa(suffix))
    }

    return currentFilename
}

func fileExists(path string) bool {
    _, err := os.Stat(path)
    return err == nil
}
