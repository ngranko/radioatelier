package external

import (
    "context"
    "time"

    "radioatelier/package/config"
    "radioatelier/package/infrastructure/notion"
    "radioatelier/package/structs/property"

    "github.com/jomei/notionapi"
)

func QueryNotionObjects(ctx context.Context, startCursor *string) (*notionapi.DatabaseQueryResponse, error) {
    return notion.GetClient().Database.Query(
        ctx,
        notionapi.DatabaseID(config.Get().NotionObjectsDBID),
        getQueryObjectRequestParams(startCursor),
    )
}

func getQueryObjectRequestParams(startCursor *string) *notionapi.DatabaseQueryRequest {
    req := notionapi.DatabaseQueryRequest{
        PageSize: 100,
        Sorts: []notionapi.SortObject{
            {
                Property:  "Последнее изменение",
                Direction: "descending",
            },
        },
        Filter: notionapi.PropertyFilter{
            Property: "Изменен",
            Checkbox: &notionapi.CheckboxFilterCondition{
                Equals: true,
            },
        },
    }

    if startCursor != nil {
        req.StartCursor = notionapi.Cursor(*startCursor)
    }

    return &req
}

func UpdateLastSync(ctx context.Context, pageID string, value time.Time) (*notionapi.Page, error) {
    return notion.GetClient().Page.Update(
        ctx,
        notionapi.PageID(pageID),
        getUpdateLastSyncRequestParams(value.Truncate(time.Second)),
    )
}

func getUpdateLastSyncRequestParams(value time.Time) *notionapi.PageUpdateRequest {
    prop := property.NewDateProperty()
    prop.SetValue(&value)
    return &notionapi.PageUpdateRequest{
        Properties: notionapi.Properties{
            "Последняя синхронизация": prop.ToNotionProperty(),
        },
    }
}
