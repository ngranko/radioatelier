package external

import (
	"context"
	"radioatelier/package/config"
	"time"

	"github.com/jomei/notionapi"
)

func QueryNotionObjects(ctx context.Context, lastSync *time.Time, startCursor *string) (*notionapi.DatabaseQueryResponse, error) {
	return NotionClient.Database.Query(
		ctx,
		notionapi.DatabaseID(config.Get().NotionObjectsDBID),
		getQueryObjectRequestParams(lastSync, startCursor),
	)
}

func getQueryObjectRequestParams(lastSync *time.Time, startCursor *string) *notionapi.DatabaseQueryRequest {
	req := notionapi.DatabaseQueryRequest{
		PageSize: 100,
		Sorts: []notionapi.SortObject{
			{
				Property:  "Последнее изменение",
				Direction: "descending",
			},
		},
	}

	if lastSync != nil {
		addQueryObjectFilter(&req, lastSync)
	}

	if startCursor != nil {
		req.StartCursor = notionapi.Cursor(*startCursor)
	}

	return &req
}

func addQueryObjectFilter(req *notionapi.DatabaseQueryRequest, lastSync *time.Time) {
	req.Filter = notionapi.PropertyFilter{
		Property: "lastSync",
		Date: &notionapi.DateFilterCondition{
			After: (*notionapi.Date)(lastSync),
		},
	}
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
			"lastSync": notionapi.DateProperty{
				Date: &notionapi.DateObject{
					Start: (*notionapi.Date)(&value),
				},
			},
		},
	}
}
