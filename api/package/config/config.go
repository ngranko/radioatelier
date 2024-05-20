package config

import (
    "log"
    "log/slog"
    "os"

    "github.com/joho/godotenv"

    "radioatelier/package/infrastructure/convert"
)

type Config struct {
    IsLive            bool
    DBHost            string
    DBUser            string
    DBPass            string
    DBName            string
    NotionToken       string
    NotionObjectsDBID string
    LogLevel          slog.Level
    JWTSecret         string
}

var config Config

func init() {
    err := godotenv.Load()
    if err != nil {
        log.Fatal("Error loading .env file")
    }

    config = Config{
        IsLive:            convert.StringToBool(os.Getenv("IS_LIVE"), true),
        DBHost:            os.Getenv("DB_HOST"),
        DBUser:            os.Getenv("DB_USER"),
        DBPass:            os.Getenv("DB_PASS"),
        DBName:            os.Getenv("DB_NAME"),
        NotionToken:       os.Getenv("NOTION_TOKEN"),
        NotionObjectsDBID: os.Getenv("NOTION_OBJECTS_DB_ID"),
        LogLevel:          slog.Level(convert.StringToInt(os.Getenv("LOG_LEVEL"), 0)),
        JWTSecret:         os.Getenv("JWT_SECRET"),
    }
}

func Get() Config {
    return config
}
