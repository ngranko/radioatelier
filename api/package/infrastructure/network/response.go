package network

import (
	"encoding/json"
	"io"
	"net/http"
)

type Response struct {
	rawResponse *http.Response
}

func NewResponse(rawResponse *http.Response) *Response {
	return &Response{
		rawResponse: rawResponse,
	}
}

func (r *Response) GetContent() ([]byte, error) {
	return io.ReadAll(r.rawResponse.Body)
}

func (r *Response) Unmarshal(val any) error {
	defer r.CloseBody()

	//if val == nil {
	//	return nil
	//}

	switch val.(type) {
	case nil:
		return nil
	case *string:
		raw, err := r.GetContent()
		if err != nil {
			return err
		}
		*val.(*string) = string(raw)
		return nil
	case *[]byte:
		raw, err := r.GetContent()
		if err != nil {
			return err
		}
		*val.(*[]byte) = raw
		return nil
	default:
		return json.NewDecoder(r.GetBody()).Decode(val)
	}
}

func (r *Response) GetBody() io.ReadCloser {
	return r.rawResponse.Body
}

func (r *Response) GetOriginalRequest() *Request {
	return NewRequestFromRaw(r.rawResponse.Request)
}

func (r *Response) GetStatusCode() int {
	return r.rawResponse.StatusCode
}

func (r *Response) CloseBody() error {
	return r.rawResponse.Body.Close()
}

func (r *Response) IsFailure() bool {
	return r.GetStatusCode() >= 400
}
