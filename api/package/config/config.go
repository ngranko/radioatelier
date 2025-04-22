package config

import (
    "log/slog"
    "os"
    "time"

    "radioatelier/package/infrastructure/transformations"
)

type Config struct {
    IsLive               bool
    LogLevel             slog.Level
    JWTSecret            string
    JWEPrivateKeyPath    string
    MinPasswordScore     int
    Host                 string
    GoogleAPIKey         string
    UploadDir            string
    ImageResolutionLimit int
    ProjectLocale        string
    MySQL                MySQLConfig
    Manticore            ManticoreConfig
    Notion               NotionConfig
    WebSocket            WebSocketConfig
}

type MySQLConfig struct {
    Host string
    User string
    Pass string
    Name string
}

type ManticoreConfig struct {
    Host  string
    Port  int
    Table string
}

type NotionConfig struct {
    Token       string
    ObjectsDBID string
}

type WebSocketConfig struct {
    PingInterval  time.Duration
    PongWait      time.Duration
    NonceLifespan time.Duration
}

var config Config

func init() {
    config = Config{
        IsLive:               transformations.StringToBool(os.Getenv("IS_LIVE"), true),
        LogLevel:             slog.Level(transformations.StringToInt(os.Getenv("LOG_LEVEL"), 0)),
        JWTSecret:            os.Getenv("JWT_SECRET"),
        JWEPrivateKeyPath:    os.Getenv("JWE_PRIVATE_KEY_PATH"),
        MinPasswordScore:     2,
        Host:                 os.Getenv("PROJECT_HOST"),
        GoogleAPIKey:         os.Getenv("GOOGLE_API_KEY"),
        UploadDir:            "/radioatelier/assets/uploads",
        ImageResolutionLimit: 1000,
        ProjectLocale:        "ru",
        MySQL: MySQLConfig{
            Host: os.Getenv("DB_HOST"),
            User: os.Getenv("DB_USER"),
            Pass: os.Getenv("DB_PASS"),
            Name: os.Getenv("DB_NAME"),
        },
        Manticore: ManticoreConfig{
            Host:  os.Getenv("MANTICORE_HOST"),
            Port:  transformations.StringToInt(os.Getenv("MANTICORE_PORT"), 9308),
            Table: os.Getenv("MANTICORE_TABLE"),
        },
        Notion: NotionConfig{
            Token:       os.Getenv("NOTION_TOKEN"),
            ObjectsDBID: os.Getenv("NOTION_OBJECTS_DB_ID"),
        },
        WebSocket: WebSocketConfig{
            NonceLifespan: 5 * time.Second,
            PongWait:      10 * time.Second,
            // should be less than PongWait, otherwise PongWait will time out between two pings
            PingInterval: 9 * time.Second,
        },
    }
}

func Get() Config {
    return config
}
