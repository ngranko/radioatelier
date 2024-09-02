package ws

import (
	"encoding/json"
)

const MessageTypeCancel = "cancel"

type Message struct {
	Type    string          `json:"type"`
	Payload json.RawMessage `json:"payload"`
	IsFinal bool            `json:"-"`
}
