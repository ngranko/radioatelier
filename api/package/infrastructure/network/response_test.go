package network_test

import (
    "bytes"
    "io"
    "net/http"
    "net/url"
    "testing"

    "radioatelier/package/infrastructure/network"
)

var responseContent = []byte("This is a test response body")

var rawResponse = http.Response{
    Body:       io.NopCloser(bytes.NewReader(responseContent)),
    StatusCode: 200,
    Request: &http.Request{
        URL: &url.URL{
            Host:   "example.com",
            Scheme: "https",
            Path:   "example",
        },
    },
}

func TestResponse_GetContent(t *testing.T) {
    response := network.NewResponse(&rawResponse)
    defer response.CloseBody()

    content, err := response.GetContent()
    if err != nil {
        t.Errorf("Test Response_GetContent(): expected error to be <nil>, got %q", err)
    }

    if !bytes.Equal(content, responseContent) {
        t.Errorf("Test Response_GetContent(): expected content to be %q, got %q", responseContent, content)
    }
}

func TestResponse_GetStatusCode(t *testing.T) {
    response := network.NewResponse(&rawResponse)
    code := response.GetStatusCode()

    if code != rawResponse.StatusCode {
        t.Errorf("Test Response_GetStatusCode(): expected %d, got %d", rawResponse.StatusCode, code)
    }
}

func TestResponse_GetBody(t *testing.T) {
    response := network.NewResponse(&rawResponse)
    body := response.GetBody()
    defer body.Close()

    if body != rawResponse.Body {
        t.Errorf("Test Response_GetStatusCode(): expected %d, got %d", rawResponse.Body, body)
    }
}

func TestResponse_GetOriginalRequest(t *testing.T) {
    response := network.NewResponse(&rawResponse)
    request := response.GetOriginalRequest()
    if request.GetURL().String() != "https://example.com/example" {
        t.Errorf("Test Response_GetOriginalRequest(): expected https://example.com/example, got %q", request.GetURL().String())
    }
}
