package document

import (
    "radioatelier/package/adapter/file"
    "radioatelier/package/adapter/file/document"
    "radioatelier/package/presentation/controller/objectImport/types"
)

type CSV struct {
    raw document.CSV
}

func OpenCSV(path string, separator rune) (*CSV, error) {
    f, err := file.Open(path)
    if err != nil {
        return nil, err
    }

    return &CSV{
        raw: document.NewCSV(f, separator),
    }, nil
}

func CSVFromFile(f file.File, separator rune) (*CSV, error) {
    return &CSV{
        raw: document.NewCSV(f, separator),
    }, nil
}

func (c *CSV) Save() (file.File, error) {
    dest, err := file.CreateTemp()
    if err != nil {
        return nil, err
    }

    err = c.raw.Save(dest)
    if err != nil {
        return nil, err
    }

    return dest, nil
}

func (c *CSV) GetPreview() ([][]string, error) {
    result := make([][]string, 0)
    for i := 0; i < 2; i++ {
        line, err := c.raw.ReadNextLine()
        if err != nil {
            return nil, err
        }
        result = append(result, line)
    }
    return result, nil
}

func (c *CSV) GetLineCount() int {
    c.raw.ResetPosition()
    count := 0

    for {
        _, err := c.raw.ReadNextLine()
        if err != nil {
            break
        }
        count++
    }

    c.raw.ResetPosition()
    return count
}

func (c *CSV) GetNextLine(mappings types.ImportMappings) (Line, error) {
    rawLine, err := c.raw.ReadNextLine()
    if err != nil {
        return nil, err
    }

    return NewLine(rawLine, mappings), nil
}
