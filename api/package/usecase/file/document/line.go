package document

import (
    "strings"

    "radioatelier/package/infrastructure/transformations"
    "radioatelier/package/presentation/controller/objectImport/types"
)

type line struct {
    raw      []string
    mappings types.ImportMappings
}

type Line interface {
    GetLatitude() string
    GetLongitude() string
    GetName() string
    GetIsVisited() bool
    GetIsPublic() bool
    GetCategory() string
    GetImage() string
    GetTags() []string
    GetPrivateTags() []string
    GetDescription() string
    GetAddress() string
    GetCity() string
    GetCountry() string
    GetInstalledPeriod() string
    GetIsRemoved() bool
    GetRemovalPeriod() string
    GetSource() string
}

func NewLine(raw []string, mappings types.ImportMappings) Line {
    return &line{
        raw:      raw,
        mappings: mappings,
    }
}

func (l *line) GetLatitude() string {
    coordinates := l.splitCoordinates()
    return coordinates[0]
}

func (l *line) GetLongitude() string {
    coordinates := l.splitCoordinates()
    return coordinates[1]
}

func (l *line) GetName() string {
    return limitLength(l.raw[l.mappings.Name], 255)
}

func (l *line) GetIsVisited() bool {
    result := false
    if l.mappings.IsVisited != nil {
        result = transformations.StringToBool(l.raw[*l.mappings.IsVisited], false)
    }
    return result
}

func (l *line) GetIsPublic() bool {
    result := false
    if l.mappings.IsPublic != nil {
        result = transformations.StringToBool(l.raw[*l.mappings.IsPublic], false)
    }
    return result
}

func (l *line) GetCategory() string {
    return limitLength(l.raw[l.mappings.Category], 100)
}

func (l *line) GetImage() string {
    result := ""
    if l.mappings.Image != nil {
        result = l.raw[*l.mappings.Image]
    }
    return result
}

func (l *line) GetTags() []string {
    result := make([]string, 0)
    if l.mappings.Tags != nil {
        result = l.splitTags(l.raw[*l.mappings.Tags])
    }

    return result
}

func (l *line) GetPrivateTags() []string {
    result := make([]string, 0)
    if l.mappings.PrivateTags != nil {
        result = l.splitTags(l.raw[*l.mappings.PrivateTags])
    }

    return result
}

func (l *line) GetDescription() string {
    result := ""
    if l.mappings.Description != nil {
        result = l.raw[*l.mappings.Description]
    }
    return result
}

func (l *line) GetAddress() string {
    result := ""
    if l.mappings.Address != nil {
        result = limitLength(l.raw[*l.mappings.Address], 128)
    }
    return result
}

func (l *line) GetCity() string {
    result := ""
    if l.mappings.City != nil {
        result = limitLength(l.raw[*l.mappings.City], 64)
    }
    return result
}

func (l *line) GetCountry() string {
    result := ""
    if l.mappings.Country != nil {
        result = limitLength(l.raw[*l.mappings.Country], 64)
    }
    return result
}

func (l *line) GetInstalledPeriod() string {
    result := ""
    if l.mappings.InstalledPeriod != nil {
        result = limitLength(l.raw[*l.mappings.InstalledPeriod], 20)
    }
    return result
}

func (l *line) GetIsRemoved() bool {
    result := false
    if l.mappings.IsRemoved != nil {
        result = transformations.StringToBool(l.raw[*l.mappings.IsRemoved], false)
    }
    return result
}

func (l *line) GetRemovalPeriod() string {
    result := ""
    if l.mappings.RemovalPeriod != nil {
        result = limitLength(l.raw[*l.mappings.RemovalPeriod], 20)
    }
    return result
}

func (l *line) GetSource() string {
    result := ""
    if l.mappings.Source != nil {
        result = l.raw[*l.mappings.Source]
    }
    return result
}

func (l *line) splitCoordinates() []string {
    parts := strings.Split(l.raw[l.mappings.Coordinates], ",")

    i := 0
    for i < 2 {
        if len(parts) > i {
            parts[i] = strings.TrimSpace(parts[i])
        } else {
            parts = append(parts, "")
        }
        i++
    }

    return parts
}

func (l *line) splitTags(tags string) []string {
    result := strings.Split(tags, ";")
    for i, tag := range result {
        result[i] = limitLength(strings.TrimSpace(tag), 100)
    }

    return result
}

func limitLength(value string, max int) string {
    if len(value) > max {
        value = value[:max]
    }
    return value
}
