package logger

import (
	"log/slog"
)

func init() {
	slog.SetDefault(GetZerolog())
}
