package network_test

import (
    "bytes"
    "io"
    "net/http"
    "testing"

    "radioatelier/package/infrastructure/network"
)

type testClient struct{}

func (t *testClient) Do(request *http.Request) (*http.Response, error) {
    response := http.Response{
        Status:     "ok",
        StatusCode: 200,
        Body:       io.NopCloser(bytes.NewReader([]byte("Test successful"))),
        Request:    request,
    }
    return &response, nil
}

func TestClient_Do(t *testing.T) {
    client := network.NewClient(&testClient{})
    request, err := network.NewRequest(network.Get, "https://example.com", nil)
    if err != nil {
        t.Errorf("Test Client_Do(): expected error to be <nil>, got %q", err)
    }

    response, err := client.Do(request)
    if err != nil {
        t.Errorf("Test Client_Do(): expected error to be <nil>, got %q", err)
    }

    if response.GetStatusCode() != 200 {
        t.Errorf("Test Client_Do(): expected status code to be 200, got %d", response.GetStatusCode())
    }

    content, err := response.GetContent()
    if err != nil {
        t.Errorf("Test Client_Do(): expected error to be <nil>, got %q", err)
    }

    if string(content) != "Test successful" {
        t.Errorf("Test Client_Do(): expected response content to be \"Test successful\", got %q", content)
    }
}

func TestClient_Get(t *testing.T) {
    url := "https://example.com"
    headers := network.Headers{
        "Authorization": "none",
    }

    client := network.NewClient(&testClient{})
    response, err := client.Get(url, headers)
    if err != nil {
        t.Errorf("Test Client_Get(): expected error to be <nil>, got %q", err)
    }

    request := response.GetOriginalRequest()

    if request.GetMethod() != network.Get {
        t.Errorf("Test Client_Get(): expected method to be GET, got %q", request.GetMethod())
    }

    if request.GetURL().String() != url {
        t.Errorf("Test Client_Get(%q, %q): expected request URL to be %q, %q given", url, headers, url, request.GetURL().String())
    }

    for name, val := range headers {
        if request.GetHeader(name) != val {
            t.Errorf("Test Client_Get(%q, %q): value of %q header expected to be %q, %q received", url, headers, name, val, request.GetHeader(name))
        }
    }
}

func TestClient_Post(t *testing.T) {
    payload := []byte("This is test body payload")

    rawClient := network.NewClient(&testClient{})
    response, err := rawClient.Post("https://example.com", bytes.NewBuffer(payload), nil)
    if err != nil {
        t.Errorf("Test Client_Post(): expected error to be <nil>, got %q", err)
    }

    request := response.GetOriginalRequest()

    if request.GetMethod() != network.Post {
        t.Errorf("Test Client_Post(): expected method to be POST, got %q", request.GetMethod())
    }

    received := make([]byte, request.GetContentLength())
    _, err = request.GetBody().Read(received)
    if err != nil {
        t.Errorf("Test Client_Post(): expected error to be <nil>, got %q", err)
    }

    if !bytes.Equal(received, payload) {
        t.Errorf("Test Client_Post(): expected body payload to be %q, body contained %q", payload, received)
    }
}
