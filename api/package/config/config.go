package config

import (
    "log"
    "os"

    "github.com/joho/godotenv"
)

type Config struct {
    DBHost            string
    DBUser            string
    DBPass            string
    DBName            string
    NotionToken       string
    NotionObjectsDBID string
}

var config Config

func init() {
    err := godotenv.Load()
    if err != nil {
        log.Fatal("Error loading .env file")
    }

    config = Config{
        DBHost:            os.Getenv("DB_HOST"),
        DBUser:            os.Getenv("DB_USER"),
        DBPass:            os.Getenv("DB_PASS"),
        DBName:            os.Getenv("DB_NAME"),
        NotionToken:       os.Getenv("NOTION_TOKEN"),
        NotionObjectsDBID: os.Getenv("NOTION_OBJECTS_DB_ID"),
    }
}

func Get() Config {
    return config
}
