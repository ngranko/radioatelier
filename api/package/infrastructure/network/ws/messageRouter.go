package ws

type MessageHandler func(event Message, c *Client) error

type MessageRouter interface {
    RouteMessage(Message, *Client) error
}
