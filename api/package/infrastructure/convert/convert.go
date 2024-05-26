package convert

import (
    "strconv"
    "unicode"
)

func StringToBool(val string, fallback bool) bool {
    boolval, err := strconv.ParseBool(val)
    if err != nil {
        return fallback
    }

    return boolval
}

func StringToInt(val string, fallback int) int {
    intval, err := strconv.Atoi(val)
    if err != nil {
        return fallback
    }

    return intval
}

func LowercaseFirst(s string) string {
    if len(s) == 0 {
        return s
    }

    r := []rune(s)
    r[0] = unicode.ToLower(r[0])

    return string(r)
}
