package request

import (
    "github.com/jomei/notionapi"

    "radioatelier/package/adapter/notion/property"
)

type UpdateRequest = notionapi.PageUpdateRequest

type UpdateBuilder interface {
    SetArchived()
    AddProperty(name string, value property.Property)
    Raw() *UpdateRequest
}

type updateRequest struct {
    rawUpdateRequest *UpdateRequest
}

func NewUpdateRequest() UpdateBuilder {
    return &updateRequest{
        rawUpdateRequest: &UpdateRequest{
            Properties: notionapi.Properties{},
        },
    }
}

func (r *updateRequest) SetArchived() {
    r.rawUpdateRequest.Archived = true
}

func (r *updateRequest) AddProperty(name string, value property.Property) {
    r.rawUpdateRequest.Properties[name] = value.Raw()
}

func (r *updateRequest) Raw() *UpdateRequest {
    return r.rawUpdateRequest
}
