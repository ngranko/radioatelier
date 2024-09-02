package repository

import (
    "context"

    "github.com/jomei/notionapi"

    "radioatelier/package/adapter/notion/model"
    "radioatelier/package/adapter/notion/request"
    "radioatelier/package/config"
    "radioatelier/package/infrastructure/notion"
)

type objectRepository struct {
    client *notion.Client
}

type Object interface {
    List(ctx context.Context, req *request.QueryRequest) (*notionapi.DatabaseQueryResponse, error)
    Create(ctx context.Context, req *request.CreateRequest) (*notionapi.Page, error)
    Update(ctx context.Context, pageID string, req *request.UpdateRequest) (*notionapi.Page, error)
    Delete(ctx context.Context, pageID string) (*notionapi.Page, error)
}

func NewObjectRepository(client *notion.Client) Object {
    return &objectRepository{client: client}
}

func (r *objectRepository) List(ctx context.Context, req *request.QueryRequest) (*notionapi.DatabaseQueryResponse, error) {
    return r.client.Database.Query(ctx, model.DatabaseID(config.Get().Notion.ObjectsDBID), req)
}

func (r *objectRepository) Create(ctx context.Context, req *request.CreateRequest) (*notionapi.Page, error) {
    return notion.GetClient().Page.Create(ctx, req)
}

func (r *objectRepository) Update(ctx context.Context, pageID string, req *request.UpdateRequest) (*notionapi.Page, error) {
    return notion.GetClient().Page.Update(ctx, model.PageID(pageID), req)
}

func (r *objectRepository) Delete(ctx context.Context, pageID string) (*notionapi.Page, error) {
    req := request.NewUpdateRequest()
    req.SetArchived()
    return notion.GetClient().Page.Update(ctx, model.PageID(pageID), req.Raw())
}
