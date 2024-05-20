package network_test

import (
    "testing"

    "radioatelier/package/infrastructure/network"
)

func TestRequest_SetHeaders(t *testing.T) {
    headers := network.Headers{
        "Authorization": "None",
        "Context-Type":  "application/json",
        "X-Test-Header": "value",
    }

    req, _ := network.NewRequest(network.Get, "", nil)
    req.SetHeaders(headers)

    for name, val := range headers {
        if req.GetHeader(name) != val {
            t.Errorf("Test Request_SetHeaders(): value of %q header expected to be %q, %q received", name, val, req.GetHeader(name))
        }
    }
}
