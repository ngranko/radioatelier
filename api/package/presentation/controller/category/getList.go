package category

import (
    "net/http"

    "github.com/google/uuid"

    "radioatelier/package/infrastructure/router"
    "radioatelier/package/usecase/presenter"
)

type GetListPayloadData struct {
    Categories []Category `json:"categories"`
}

type Category struct {
    ID   uuid.UUID `json:"id"`
    Name string    `json:"name"`
}

func GetList(w http.ResponseWriter, r *http.Request) {
    var categories []Category
    list, err := presenter.GetCategoryList()
    if err != nil {
        router.NewResponse().WithStatus(http.StatusInternalServerError).Send(w)
        return
    }

    for _, category := range list {
        categories = append(categories, Category{ID: category.GetModel().ID, Name: category.GetModel().Name})
    }

    if categories == nil {
        categories = make([]Category, 0)
    }

    router.NewResponse().
        WithStatus(http.StatusOK).
        WithPayload(router.Payload{
            Data: GetListPayloadData{
                Categories: categories,
            },
        }).
        Send(w)
}
