package convert

import (
    "strconv"
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
