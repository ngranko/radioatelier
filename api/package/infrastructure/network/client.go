package network

import (
	"io"
	"net/http"
)

type HTTPClient interface {
	Do(req *http.Request) (*http.Response, error)
}

type Client struct {
	rawClient HTTPClient
}

var clientCache = make(map[HTTPClient]*Client)

func NewClient(rawClient HTTPClient) *Client {
	if clientCache[rawClient] == nil {
		clientCache[rawClient] = &Client{
			rawClient: rawClient,
		}
	}
	return clientCache[rawClient]
}

func (c *Client) Do(request *Request) (*Response, error) {
	rawResponse, err := c.rawClient.Do(request.rawRequest)
	if err != nil {
		return nil, err
	}

	return NewResponse(rawResponse), nil
}

func (c *Client) Get(url string, headers Headers) (*Response, error) {
	request, err := NewRequest(Get, url, nil)
	if err != nil {
		return nil, err
	}

	if headers != nil {
		request.SetHeaders(headers)
	}

	return c.Do(request)
}

func (c *Client) Post(url string, body io.Reader, headers Headers) (*Response, error) {
	request, err := NewRequest(Post, url, body)
	if err != nil {
		return nil, err
	}

	if headers != nil {
		request.SetHeaders(headers)
	}

	return c.Do(request)
}

func (c *Client) Delete(url string, headers Headers) (*Response, error) {
	request, err := NewRequest(Delete, url, nil)
	if err != nil {
		return nil, err
	}

	if headers != nil {
		request.SetHeaders(headers)
	}

	return c.Do(request)
}
