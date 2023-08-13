package request

import (
    "github.com/jomei/notionapi"

    "radioatelier/package/adapter/notion/property"
)

type CreateRequest = notionapi.PageCreateRequest

type CreateBuilder interface {
    SetParent(parentID string)
    AddProperty(name string, value property.Property)
    Raw() *CreateRequest
}

type createRequest struct {
    rawCreateRequest *CreateRequest
}

func NewCreateRequest() CreateBuilder {
    return &createRequest{
        rawCreateRequest: &CreateRequest{
            Properties: notionapi.Properties{},
        },
    }
}

func (r *createRequest) SetParent(parentID string) {
    r.rawCreateRequest.Parent = notionapi.Parent{
        DatabaseID: notionapi.DatabaseID(parentID),
    }
}

func (r *createRequest) AddProperty(name string, value property.Property) {
    r.rawCreateRequest.Properties[name] = value.Raw()
}

func (r *createRequest) Raw() *CreateRequest {
    return r.rawCreateRequest
}
