package types

import (
    "radioatelier/package/adapter/db/model"
)

const (
    MessageTypeInput       string = "input"
    MessageTypeProcessPing        = "processPing"
    MessageTypeError              = "error"
    MessageTypeSuccess            = "success"
    MessageTypeProgress           = "progress"
)

type InputPayload struct {
    ID        string         `json:"id" validate:"required"`
    Separator string         `json:"separator" validate:"required"`
    Mappings  ImportMappings `json:"mappings" validate:"required"`
}

type ImportMappings struct {
    Coordinates     int  `json:"coordinates" validate:"number"`
    Name            int  `json:"name" validate:"number"`
    IsVisited       *int `json:"isVisited"`
    Rating          *int `json:"rating"`
    IsPublic        *int `json:"isPublic"`
    Category        int  `json:"category" validate:"number"`
    Image           *int `json:"image"`
    Tags            *int `json:"tags"`
    PrivateTags     *int `json:"privateTags"`
    Description     *int `json:"description"`
    Address         *int `json:"address"`
    City            *int `json:"city"`
    Country         *int `json:"country"`
    InstalledPeriod *int `json:"installedPeriod"`
    IsRemoved       *int `json:"isRemoved"`
    RemovalPeriod   *int `json:"removalPeriod"`
    Source          *int `json:"source"`
}

type Location struct {
    Latitude  string `validate:"required,latitude"`
    Longitude string `validate:"required,longitude"`
}

type ProgressPayload struct {
    Percentage int `json:"percentage"`
}

type ResultPayload struct {
    Text     string         `json:"text"`
    Feedback []LineFeedback `json:"feedback"`
}

type LineFeedback struct {
    Text     string `json:"text"`
    Severity string `json:"severity"`
}

type ErrorPayload struct {
    Error string `json:"error"`
}

type ImportClientParams struct {
    User *model.User
}
