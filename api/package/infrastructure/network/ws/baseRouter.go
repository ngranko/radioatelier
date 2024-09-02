package ws

import (
    "errors"

    "radioatelier/package/infrastructure/logger"
)

type baseRouter struct {
    processRouter MessageRouter
}

func NewBaseRouter(processRouter MessageRouter) MessageRouter {
    return &baseRouter{
        processRouter: processRouter,
    }
}

func (r *baseRouter) RouteMessage(message Message, client *Client) error {
    if !client.IsActive() {
        return errors.New("received a message, but the client is closed")
    }

    if message.Type == MessageTypeCancel {
        logger.GetZerolog().Info("received a cancel message, closing the client")
        client.Cancel()
        client.close()
        return nil
    }

    return r.processRouter.RouteMessage(message, client)
}
