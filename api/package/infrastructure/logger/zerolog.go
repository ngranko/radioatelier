package logger

import (
    "io"
    "log/slog"
    "os"
    "sync"
    "time"

    "github.com/rs/zerolog"
    "github.com/rs/zerolog/pkgerrors"
    slogzerolog "github.com/samber/slog-zerolog/v2"
    "gopkg.in/natefinch/lumberjack.v2"

    "radioatelier/package/config"
)

var dOnce sync.Once

var zerologLogger *slog.Logger

func GetZerolog() *slog.Logger {
    dOnce.Do(func() {
        zerolog.ErrorStackMarshaler = pkgerrors.MarshalStack
        zerolog.TimeFieldFormat = time.RFC3339Nano

        var output io.Writer = zerolog.ConsoleWriter{
            Out:        os.Stdout,
            TimeFormat: time.RFC3339,
        }

        if config.Get().IsLive {
            fileLogger := &lumberjack.Logger{
                Filename:   "log/logfile.log",
                MaxSize:    5,
                MaxBackups: 10,
                MaxAge:     14,
                Compress:   true,
            }

            output = zerolog.MultiLevelWriter(
                os.Stderr,
                fileLogger,
            )
        }

        zl := zerolog.New(output).
            With().
            Timestamp().
            Logger()

        zerologLogger = slog.New(
            slogzerolog.Option{
                Level:  config.Get().LogLevel,
                Logger: &zl,
            }.NewZerologHandler(),
        )
    })

    return zerologLogger
}
