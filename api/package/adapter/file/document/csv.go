package document

import (
    "encoding/csv"

    "radioatelier/package/adapter/file"
)

type csvDocument struct {
    raw       file.File
    reader    *csv.Reader
    separator rune
}

type CSV interface {
    ResetPosition()
    ReadNextLine() ([]string, error)
    ReadAll() ([][]string, error)
    Save(file file.File) error
}

func NewCSV(reader file.File, separator rune) CSV {
    csvReader := csv.NewReader(reader)
    csvReader.Comma = separator
    csvReader.LazyQuotes = true

    return &csvDocument{
        raw:       reader,
        reader:    csvReader,
        separator: separator,
    }
}

func (c *csvDocument) ResetPosition() {
    _ = c.raw.ResetPointer()
    c.reader = csv.NewReader(c.raw)
    c.reader.Comma = c.separator
    c.reader.LazyQuotes = true
}

func (c *csvDocument) ReadNextLine() ([]string, error) {
    return c.reader.Read()
}

func (c *csvDocument) ReadAll() ([][]string, error) {
    c.ResetPosition()
    return c.reader.ReadAll()
}

func (c *csvDocument) Save(file file.File) error {
    err := file.Save(c.raw)
    if err != nil {
        return err
    }
    return nil
}
