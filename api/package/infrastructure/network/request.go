package network

import (
	"io"
	"mime/multipart"
	"net/http"
	"net/url"
)

type Method string

type Headers = map[string]string

type Request struct {
	rawRequest *http.Request
}

const (
	Get    Method = "GET"
	Post   Method = "POST"
	Put    Method = "PUT"
	Delete Method = "DELETE"
)

func NewRequest(method Method, url string, body io.Reader) (*Request, error) {
	req, err := http.NewRequest(string(method), url, body)
	if err != nil {
		return nil, err
	}
	return &Request{
		rawRequest: req,
	}, nil
}

func NewRequestFromRaw(rawRequest *http.Request) *Request {
	return &Request{
		rawRequest: rawRequest,
	}
}

func (r *Request) SetHeaders(headers Headers) *Request {
	for key, value := range headers {
		r.rawRequest.Header.Add(key, value)
	}
	return r
}

func (r *Request) GetHeader(name string) string {
	return r.rawRequest.Header.Get(name)
}

func (r *Request) GetURL() *url.URL {
	return r.rawRequest.URL
}

func (r *Request) GetMethod() Method {
	return Method(r.rawRequest.Method)
}

func (r *Request) GetBody() io.ReadCloser {
	return r.rawRequest.Body
}

func (r *Request) GetContentLength() int64 {
	return r.rawRequest.ContentLength
}

func (r *Request) GetFile(key string) (multipart.File, *multipart.FileHeader, error) {
	return r.rawRequest.FormFile(key)
}
