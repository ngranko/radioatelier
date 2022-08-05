package external

import (
	"context"
	"radioatelier/package/config"
	"time"

	"github.com/jomei/notionapi"
)

func QueryNotionObjects(ctx context.Context, startCursor *string) (*notionapi.DatabaseQueryResponse, error) {
	return NotionClient.Database.Query(
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
	return NotionClient.Page.Update(
		ctx,
		notionapi.PageID(pageID),
		getUpdateLastSyncRequestParams(value),
	)
}

func getUpdateLastSyncRequestParams(value time.Time) *notionapi.PageUpdateRequest {
	return &notionapi.PageUpdateRequest{
		Properties: notionapi.Properties{
			"Последняя синхронизация": notionapi.DateProperty{
				Date: &notionapi.DateObject{
					Start: (*notionapi.Date)(&value),
				},
			},
		},
	}
}
