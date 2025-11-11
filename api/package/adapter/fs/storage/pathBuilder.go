package storage

import (
    "fmt"
    "path/filepath"
    "strings"
    "time"
)

type LocalPathBuilder struct{}

func NewLocalPathBuilder() *LocalPathBuilder {
    return &LocalPathBuilder{}
}

func (p *LocalPathBuilder) BuildOriginalFilename(originalFilename string) string {
    currentTimestamp := time.Now().Unix()
    extention := filepath.Ext(originalFilename)
    name := strings.TrimSuffix(filepath.Base(originalFilename), extention)
    return fmt.Sprintf("%s_%d%s", name, currentTimestamp, extention)
}

func (p *LocalPathBuilder) BuildPreviewFilename(fullFilename string) string {
    extention := filepath.Ext(fullFilename)
    name := strings.TrimSuffix(filepath.Base(fullFilename), extention)
    return fmt.Sprintf("%s.preview.%d%s", name, time.Now().Unix(), extention)
}
