package document

import (
    "bufio"
    "bytes"
    "encoding/csv"
    "io"

    "radioatelier/package/adapter/file"
)

type csvDocument struct {
    raw io.Reader
}

type CSV interface {
    ReadFirstNLines(rowLimit int, separator rune) ([][]string, error)
    ReadAll(separator rune) ([][]string, error)
    Save(file file.File) error
}

func NewCSV(reader io.Reader) CSV {
    return &csvDocument{
        raw: reader,
    }
}

func (c *csvDocument) ReadFirstNLines(rowLimit int, separator rune) ([][]string, error) {
    result := ""
    scanner := bufio.NewScanner(c.raw)

    for i := 1; i <= rowLimit; i++ {
        scanner.Scan()
        result += scanner.Text() + "\n"
    }
    if err := scanner.Err(); err != nil {
        return nil, err
    }

    return c.decodeContents(bytes.NewReader([]byte(result)), separator)
}

func (c *csvDocument) ReadAll(separator rune) ([][]string, error) {
    return c.decodeContents(c.raw, separator)
}

func (c *csvDocument) Save(file file.File) error {
    fileBytes, err := io.ReadAll(c.raw)
    if err != nil {
        return err
    }
    _, err = file.Write(fileBytes)
    if err != nil {
        return err
    }
    return nil
}

func (c *csvDocument) decodeContents(contents io.Reader, separator rune) ([][]string, error) {
    reader := csv.NewReader(contents)
    reader.Comma = separator
    parsed, err := reader.ReadAll()
    if err != nil {
        return nil, err
    }

    return parsed, nil
}
