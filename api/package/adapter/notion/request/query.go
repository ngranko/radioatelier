package request

import (
    "github.com/jomei/notionapi"

    "radioatelier/package/adapter/notion/filter"
    "radioatelier/package/adapter/notion/model"
)

type QueryRequest = notionapi.DatabaseQueryRequest

type QueryBuilder interface {
    SetPageSize(size int)
    SetStartCursor(cursor model.Cursor)
    SortAsc(property string)
    SortDesc(property string)
    Where(filter filter.Filter)
    Raw() *QueryRequest
}

type queryRequest struct {
    rawQueryRequest *QueryRequest
}

func NewQueryRequest() QueryBuilder {
    return &queryRequest{
        rawQueryRequest: &QueryRequest{
            Sorts: []notionapi.SortObject{},
        },
    }
}

func (r *queryRequest) SetPageSize(size int) {
    r.rawQueryRequest.PageSize = size
}

func (r *queryRequest) SortAsc(property string) {
    r.rawQueryRequest.Sorts = append(
        r.rawQueryRequest.Sorts,
        notionapi.SortObject{
            Property:  property,
            Direction: "ascending",
        },
    )
}

func (r *queryRequest) SortDesc(property string) {
    r.rawQueryRequest.Sorts = append(
        r.rawQueryRequest.Sorts,
        notionapi.SortObject{
            Property:  property,
            Direction: "descending",
        },
    )
}

func (r *queryRequest) Where(f filter.Filter) {
    r.rawQueryRequest.Filter = f.Raw()
}

func (r *queryRequest) SetStartCursor(cursor model.Cursor) {
    r.rawQueryRequest.StartCursor = cursor
}

func (r *queryRequest) Raw() *QueryRequest {
    return r.rawQueryRequest
}
