package ws

import (
    "context"
    "encoding/json"
    "errors"
    "log/slog"
    "sync"
    "time"

    "github.com/gorilla/websocket"

    "radioatelier/package/config"
    "radioatelier/package/infrastructure/logger"
)

// ClientList is a map used to help manage a map of clients
type ClientList map[*Client]bool

// Client is a websocket client, basically a frontend visitor
type Client struct {
    Status     ClientStatus
    Context    context.Context
    connection *websocket.Conn
    router     MessageRouter
    egress     chan Message
    active     bool
    lock       sync.Mutex
    Cancel     context.CancelFunc
}

// NewClient is used to initialize a new Client with all required values initialized
func NewClient(ctx context.Context, conn *websocket.Conn, router MessageRouter) *Client {
    ctx, cancel := context.WithCancel(ctx)
    return &Client{
        Status:     ClientStatusReady,
        Context:    ctx,
        connection: conn,
        router:     NewBaseRouter(router),
        egress:     make(chan Message),
        active:     true,
        lock:       sync.Mutex{},
        Cancel:     cancel,
    }
}

// ReadMessages will start the client to read messages and handle them appropriately.
// This is supposed to be run as a goroutine
func (c *Client) ReadMessages() {
    defer func() {
        logger.GetZerolog().Info("closing a client connection from readMessages")
        c.close()
    }()

    c.connection.SetReadLimit(1024 * 1024 * 5)
    if err := c.connection.SetReadDeadline(time.Now().Add(config.Get().WebSocket.PongWait)); err != nil {
        logger.GetZerolog().Error("failed setting a deadline", slog.Any("error", err))
        return
    }
    c.connection.SetPongHandler(c.pongHandler)

    for {
        _, payload, err := c.connection.ReadMessage()
        if err != nil {
            if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure, websocket.CloseNoStatusReceived) {
                logger.GetZerolog().Error("error reading message", slog.Any("error", err))
            }
            break
        }

        var message Message
        if err := json.Unmarshal(payload, &message); err != nil {
            logger.GetZerolog().Error("error unmarshalling message", slog.Any("error", err))
            break
        }

        logger.GetZerolog().Info("received a message through websocket", slog.Any("type", message.Type))
        err = c.router.RouteMessage(message, c)
        if err != nil {
            logger.GetZerolog().Error("error handling message", slog.Any("error", err))
            break
        }
    }
}

// pongHandler is used to handle PongMessages for the Client
func (c *Client) pongHandler(_pongMsg string) error {
    return c.connection.SetReadDeadline(time.Now().Add(config.Get().WebSocket.PongWait))
}

// WriteMessages is a process that listens for new messages to output to the Client
func (c *Client) WriteMessages() {
    ticker := time.NewTicker(config.Get().WebSocket.PingInterval)
    defer func() {
        logger.GetZerolog().Info("closing a client connection from writeMessages")
        ticker.Stop()
        c.close()
    }()

    for {
        select {
        case message, ok := <-c.egress:
            if !ok {
                err := c.connection.WriteMessage(websocket.CloseMessage, nil)
                if err != nil {
                    logger.GetZerolog().Info("connection closed", slog.Any("error", err))
                }
                return
            }

            data, err := json.Marshal(message)
            if err != nil {
                logger.GetZerolog().Error("error marshalling a message", slog.Any("error", err))
                return
            }

            err = c.connection.WriteMessage(websocket.TextMessage, data)
            if err != nil {
                logger.GetZerolog().Error("error sending a message", slog.Any("error", err))
                return
            }

            if message.IsFinal {
                time.Sleep(time.Second * 2)
                return
            }
        case <-ticker.C:
            err := c.connection.WriteMessage(websocket.PingMessage, []byte{})
            if err != nil {
                logger.GetZerolog().Error("error sending a message", slog.Any("error", err))
                return
            }
        }
    }
}

func (c *Client) SendMessage(messageType string, payload interface{}, isFinal bool) error {
    if !c.IsActive() {
        logger.GetZerolog().Info("trying to send a message through a closed channel", slog.String("type", messageType), slog.Any("payload", payload))
        return errors.New("trying to send a message on a closed channel")
    }

    data, err := json.Marshal(payload)
    if err != nil {
        return err
    }

    c.egress <- Message{Type: messageType, Payload: data, IsFinal: isFinal}
    return nil
}

func (c *Client) IsActive() bool {
    return c.active
}

func (c *Client) close() {
    c.lock.Lock()
    defer c.lock.Unlock()

    if !c.IsActive() {
        return
    }

    close(c.egress)
    _ = c.connection.Close()
    c.active = false
    c.Status = ClientStatusClosed
}
