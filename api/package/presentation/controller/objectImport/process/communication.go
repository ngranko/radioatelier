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
    percentage int
    error      error
    result     *result
}

type result struct {
    text   string
    errors []string
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

            logger.GetZerolog().Info("received a message from handler goroutine", slog.Int("percentage", msg.percentage), slog.Any("error", msg.error), slog.Any("result", msg.result), slog.String("user", user.GetModel().ID.String()))
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
    user := client.Context.Value("user").(presenter.User)

    if msg.error != nil {
        logger.GetZerolog().Info("message is error", slog.String("user", user.GetModel().ID.String()))
        processErrorMessage(msg.error, client)
        return true
    }

    if msg.result != nil {
        logger.GetZerolog().Info("message is success", slog.String("user", user.GetModel().ID.String()))
        processSuccessMessage(msg, client)
        return true
    }

    logger.GetZerolog().Info("message is progress", slog.String("user", user.GetModel().ID.String()))
    processProgressMessage(msg, client)
    return false
}

func processErrorMessage(err error, client *ws.Client) {
    _ = sendMessageToClient(client, types.MessageTypeError, types.ErrorPayload{Error: err.Error()}, true)
}

func processSuccessMessage(msg message, client *ws.Client) {
    payload := types.ResultPayload{Text: msg.result.text, Errors: msg.result.errors}
    _ = sendMessageToClient(client, types.MessageTypeSuccess, payload, true)
}

func processProgressMessage(msg message, client *ws.Client) {
    payload := types.ProgressPayload{Percentage: msg.percentage}
    _ = sendMessageToClient(client, types.MessageTypeProgress, payload, false)
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
