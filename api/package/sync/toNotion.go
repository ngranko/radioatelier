package sync

import (
    "context"
    "radioatelier/ent"
    "radioatelier/package/config"
    "radioatelier/package/external"
    "radioatelier/package/structs"

    "github.com/jomei/notionapi"
)

func createInNotion(ctx context.Context, obj *ent.Object) error {
    _, err := external.NotionClient.Page.Create(
        ctx,
        getCreatePageRequestParams(ctx, obj),
    )
    return err
}

func updateInNotion(ctx context.Context, obj *ent.Object) error {
    _, err := external.NotionClient.Page.Update(
        ctx,
        notionapi.PageID(*obj.NotionID),
        getUpdatePageRequestParams(ctx, obj),
    )
    return err
}

func deleteInNotion(ctx context.Context, obj *ent.Object) error {
    _, err := external.NotionClient.Page.Update(
        ctx,
        notionapi.PageID(*obj.NotionID),
        &notionapi.PageUpdateRequest{
            Archived: true,
        },
    )
    return err
}

func getCreatePageRequestParams(ctx context.Context, obj *ent.Object) *notionapi.PageCreateRequest {
    req := notionapi.PageCreateRequest{
        Parent: notionapi.Parent{
            DatabaseID: notionapi.DatabaseID(config.Get().NotionObjectsDBID),
        },
        Properties: structs.NewPageProperties().FillFromObject(ctx, obj).ToNotionProperties(),
    }

    return &req
}

func getUpdatePageRequestParams(ctx context.Context, obj *ent.Object) *notionapi.PageUpdateRequest {
    req := notionapi.PageUpdateRequest{
        Properties: structs.NewPageProperties().FillFromObject(ctx, obj).ToNotionProperties(),
    }

    return &req
}

func updateLastSync(ctx context.Context, obj *ent.Object) {
    obj.Update().
        SetLastSync(*obj.LastSync).
        Save(ctx)
}
