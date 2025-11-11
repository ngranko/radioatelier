package storage

import (
    "fmt"
    "os"
    "path/filepath"
)

type LocalStorage struct {
    uploadDir string
}

func NewLocalStorage(uploadDir string) *LocalStorage {
    return &LocalStorage{
        uploadDir: uploadDir,
    }
}

func (s *LocalStorage) Open(absPath string) (*os.File, error) {
    return os.Open(absPath)
}

func (s *LocalStorage) Remove(absPath string) error {
    return os.Remove(absPath)
}

func (s *LocalStorage) Abs(relPath string) string {
    return filepath.Join(s.uploadDir, relPath)
}

func (s *LocalStorage) ToPublicURL(relPath string) string {
    return filepath.Clean(fmt.Sprintf("/uploads/%s", filepath.ToSlash(relPath)))
}
