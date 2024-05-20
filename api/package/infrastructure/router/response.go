package router

import (
    "encoding/json"
    "log/slog"
    "net/http"

    "radioatelier/package/infrastructure/logger"
)

type response struct {
    status  int
    payload *Payload
    rawBody []byte
    headers map[string]string
}

type Payload struct {
    Message string            `json:"message"`
    Errors  map[string]string `json:"errors"`
    Data    interface{}       `json:"data"`
}

type Response interface {
    WithStatus(status int) Response
    WithPayload(payload Payload) Response
    WithRawBody(rawBody []byte) Response
    WithHeader(key string, value string) Response
    Send(w http.ResponseWriter)
}

func NewResponse() Response {
    return &response{
        rawBody: []byte(""),
        headers: map[string]string{},
    }
}

func (r *response) WithStatus(status int) Response {
    r.status = status
    return r
}

func (r *response) WithPayload(payload Payload) Response {
    r.payload = &payload
    return r
}

func (r *response) WithRawBody(rawBody []byte) Response {
    r.rawBody = rawBody
    return r
}

func (r *response) WithHeader(key string, value string) Response {
    r.headers[key] = value
    return r
}

func (r *response) Send(w http.ResponseWriter) {
    w.WriteHeader(r.status)

    for key, val := range r.headers {
        w.Header().Set(key, val)
    }

    var body []byte
    var err error
    if r.payload == nil {
        body = r.rawBody
    } else {
        body, err = json.Marshal(r.payload)
        if err != nil {
            body = []byte("")
        }
    }

    _, err = w.Write(body)
    if err != nil {
        logger.GetZerolog().Error("error occurred while writing an http response", slog.Any("error", err))
    }
}
