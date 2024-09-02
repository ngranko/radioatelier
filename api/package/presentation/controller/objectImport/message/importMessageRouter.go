package message

import (
    "errors"
    "log/slog"

    "radioatelier/package/infrastructure/logger"
    "radioatelier/package/infrastructure/network/ws"
    "radioatelier/package/presentation/controller/objectImport/types"
)

type FeedbackMessageRouter struct {
    handlers map[string]ws.MessageHandler
}

func NewFeedbackMessageRouter() *FeedbackMessageRouter {
    return &FeedbackMessageRouter{
        handlers: map[string]ws.MessageHandler{
            types.MessageTypeInput: inputMessageHandler,
        },
    }
}

func (r *FeedbackMessageRouter) RouteMessage(message ws.Message, client *ws.Client) error {
    if client.Status != ws.ClientStatusReady {
        return errors.New("received a message, but the client is not ready")
    }

    if handler, ok := r.handlers[message.Type]; ok {
        client.Status = ws.ClientStatusProcessing
        return handler(message, client)
    } else {
        logger.GetZerolog().Warn("Got message with an unsupported type, ignoring it", slog.String("type", message.Type))
        return nil
    }
}
