package file

import (
    "os"
    "path/filepath"
    "strconv"
    "strings"
    "unicode"

    "github.com/essentialkaos/translit/v2"
    "golang.org/x/text/runes"
    "golang.org/x/text/transform"
    "golang.org/x/text/unicode/norm"
    "golang.org/x/text/unicode/rangetable"
)

func removeIllFormed(input string) string {
    output, _, _ := transform.String(runes.ReplaceIllFormed(), input)
    return output
}

func toLower(input string) string {
    return strings.ToLower(input)
}

func tranliterate(input string) string {
    return translit.ICAO(input)
}

func replaceNonAlphaNum(input string) string {
    removeNonAlphaNum := runes.Remove(runes.NotIn(rangetable.Merge(unicode.Latin, unicode.Digit, unicode.White_Space, unicode.Punct)))
    output, _, _ := transform.String(removeNonAlphaNum, input)
    return output
}

func removeAccents(input string) string {
    t := transform.Chain(norm.NFD, runes.Remove(runes.In(unicode.Mn)), norm.NFC)
    s, _, _ := transform.String(t, input)
    r := strings.NewReplacer("ł", "l", "Ł", "L")
    return r.Replace(s)
}

func trimEnds(input string) string {
    return strings.TrimFunc(input, func(r rune) bool {
        return !unicode.IsLetter(r) && !unicode.IsDigit(r)
    })
}

func sanitize(input string) string {
    return trimEnds(replaceNonAlphaNum(removeAccents(tranliterate(toLower(removeIllFormed(input))))))
}

func getUniqueFilename(path string) string {
    suffix := 0
    currentFilename := path

    for fileExists(currentFilename) {
        suffix++
        currentFilename = suffixFilename(path, strconv.Itoa(suffix))
    }

    return currentFilename
}

func suffixFilename(original string, suffix string) string {
    dirname := filepath.Dir(original)
    basename := filepath.Base(original)
    extension := filepath.Ext(original)
    name := basename[:len(basename)-len(extension)]
    return dirname + "/" + sanitize(name+"_"+suffix) + extension
}

func fileExists(path string) bool {
    _, err := os.Stat(path)
    return err == nil
}
