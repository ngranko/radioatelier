package filter

import (
    "github.com/jomei/notionapi"
)

type CompoundFilter = notionapi.CompoundFilter
type AndCompoundFilter = notionapi.AndCompoundFilter
type OrCompoundFilter = notionapi.OrCompoundFilter

type CheckboxCondition = notionapi.CheckboxFilterCondition

type Filter interface {
    Raw() notionapi.Filter
}

type AndFilter struct {
    list []notionapi.Filter
}

func NewAndFilter() *AndFilter {
    return &AndFilter{
        list: []notionapi.Filter{},
    }
}

func (f *AndFilter) Add(filter Filter) {
    f.list = append(f.list, filter.Raw())
}

func (f *AndFilter) Raw() notionapi.AndCompoundFilter {
    return f.list
}

type OrFilter struct {
    list []notionapi.Filter
}

func NewOrFilter() *AndFilter {
    return &AndFilter{
        list: []notionapi.Filter{},
    }
}

func (f *OrFilter) Add(filter Filter) {
    f.list = append(f.list, filter.Raw())
}

func (f *OrFilter) Raw() notionapi.OrCompoundFilter {
    return f.list
}

type CheckboxFilter struct {
    Name      string
    Condition *CheckboxCondition
}

func (f *CheckboxFilter) Raw() notionapi.Filter {
    return notionapi.PropertyFilter{
        Property: f.Name,
        Checkbox: f.Condition,
    }
}
