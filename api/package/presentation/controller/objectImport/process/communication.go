package process

import (
    "log/slog"
    "time"

    "radioatelier/package/infrastructure/logger"
    "radioatelier/package/infrastructure/network/ws"
    "radioatelier/package/presentation/controller/objectImport/types"
    "radioatelier/package/usecase/presenter"
)

type message struct {
    state      string
    total      int
    successful int
    percentage int
    error      error
    feedback   []types.LineFeedback
}

func StartImport(ID string, separator rune, mappings types.ImportMappings, client *ws.Client) {
    ch := make(chan message)
    defer close(ch)

    user := client.Context.Value("user").(presenter.User)

    go sendPings(client)
    go importObjects(client.Context, ch, ID, separator, mappings)

    for {
        select {
        case <-client.Context.Done():
            logger.GetZerolog().Info("context is cancelled, exiting", slog.String("user", user.GetModel().ID.String()))
            return
        case msg, ok := <-ch:
            if !ok {
                processReadFailure(client)
                return
            }

            logger.GetZerolog().Info("received a message from handler goroutine", slog.Any("message", msg), slog.String("user", user.GetModel().ID.String()))
            isComplete := processMessage(msg, client)
            if isComplete {
                return
            }
        }
    }
}

func sendPings(client *ws.Client) {
    for client.IsActive() {
        _ = client.SendMessage(types.MessageTypeProcessPing, nil, false)
        time.Sleep(time.Second * 5)
    }
}

func processReadFailure(client *ws.Client) {
    user := client.Context.Value("user").(presenter.User)

    logger.GetZerolog().Info("channel between handler and listening goroutines closed before returning any data", slog.String("user", user.GetModel().ID.String()))

    payload := types.ErrorPayload{Error: "channel closed before returning data from OpenAI"}
    ok := sendMessageToClient(client, types.MessageTypeError, payload, true)
    if !ok {
        return
    }
}

func processMessage(msg message, client *ws.Client) (isComplete bool) {
    payload := types.Payload{
        Type:       msg.state,
        Total:      msg.total,
        Successful: msg.successful,
        Percentage: msg.percentage,
        Error:      msg.error.Error(),
        Feedback:   msg.feedback,
    }
    _ = sendMessageToClient(client, msg.state, payload, msg.state != types.MessageTypeProgress)

    return msg.state != types.MessageTypeProgress
}

func sendMessageToClient(client *ws.Client, resultType string, payload interface{}, isFinal bool) bool {
    if !client.IsActive() {
        logger.GetZerolog().Info("trying to send a message through a closed channel", slog.String("type", resultType), slog.Any("payload", payload))
        client.Cancel()
        return false
    }

    user := client.Context.Value("user").(presenter.User)
    err := client.SendMessage(resultType, payload, isFinal)
    if err != nil {
        logger.GetZerolog().Error("failed to send a websocket message", slog.Any("error", err), slog.String("user", user.GetModel().ID.String()))
        return false
    }

    return true
}
