package document

import (
    "mime/multipart"

    "radioatelier/package/adapter/file"
    "radioatelier/package/adapter/file/document"
)

type CSV struct {
    raw document.CSV
}

func NewCSV(upload multipart.File) (*CSV, error) {
    return &CSV{
        raw: document.NewCSV(upload),
    }, nil
}

func OpenCSV(path string) (*CSV, error) {
    f, err := file.Open(path)
    if err != nil {
        return nil, err
    }

    return &CSV{
        raw: document.NewCSV(f),
    }, nil
}

func (c *CSV) Save() (file.File, error) {
    dest, err := file.CreateTempFile()
    if err != nil {
        return nil, err
    }

    err = c.raw.Save(dest)
    if err != nil {
        return nil, err
    }

    return dest, nil
}

func (c *CSV) GetPreview(separator rune) ([][]string, error) {
    return c.raw.ReadFirstNLines(2, separator)
}
