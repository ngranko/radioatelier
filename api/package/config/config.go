package config

import (
    "log/slog"
    "os"

    "radioatelier/package/infrastructure/transformations"
)

type Config struct {
    IsLive               bool
    DBHost               string
    DBUser               string
    DBPass               string
    DBName               string
    NotionToken          string
    NotionObjectsDBID    string
    LogLevel             slog.Level
    JWTSecret            string
    JWEPrivateKeyPath    string
    MinPasswordScore     int
    Host                 string
    GoogleAPIKey         string
    UploadDir            string
    ImageResolutionLimit int
}

var config Config

func init() {
    config = Config{
        IsLive:               transformations.StringToBool(os.Getenv("IS_LIVE"), true),
        DBHost:               os.Getenv("DB_HOST"),
        DBUser:               os.Getenv("DB_USER"),
        DBPass:               os.Getenv("DB_PASS"),
        DBName:               os.Getenv("DB_NAME"),
        NotionToken:          os.Getenv("NOTION_TOKEN"),
        NotionObjectsDBID:    os.Getenv("NOTION_OBJECTS_DB_ID"),
        LogLevel:             slog.Level(transformations.StringToInt(os.Getenv("LOG_LEVEL"), 0)),
        JWTSecret:            os.Getenv("JWT_SECRET"),
        JWEPrivateKeyPath:    os.Getenv("JWE_PRIVATE_KEY_PATH"),
        MinPasswordScore:     2,
        Host:                 os.Getenv("PROJECT_HOST"),
        GoogleAPIKey:         os.Getenv("GOOGLE_API_KEY"),
        UploadDir:            "/radioatelier/assets/uploads",
        ImageResolutionLimit: 1000,
    }
}

func Get() Config {
    return config
}
