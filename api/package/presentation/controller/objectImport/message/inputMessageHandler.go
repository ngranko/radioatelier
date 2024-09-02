package message

import (
    "encoding/json"

    "radioatelier/package/config"
    "radioatelier/package/infrastructure/network/ws"
    "radioatelier/package/presentation/controller/objectImport/process"
    "radioatelier/package/presentation/controller/objectImport/types"
    "radioatelier/package/usecase/validation/validator"
)

func inputMessageHandler(message ws.Message, client *ws.Client) error {
    var payload types.InputPayload
    if err := json.Unmarshal(message.Payload, &payload); err != nil {
        return err
    }

    res := validator.Get().ValidateStruct(payload)
    if !res.IsValid() {
        validationErrors := res.GetErrors(config.Get().ProjectLocale)
        for _, value := range validationErrors {
            // I'm just interested in the first error
            err := client.SendMessage(types.MessageTypeError, types.ErrorPayload{Error: value}, true)
            if err != nil {
                return err
            }

            return nil
        }
    }

    go process.StartImport(payload.ID, payload.Mappings, client)
    return nil
}
