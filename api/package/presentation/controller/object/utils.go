package object

import (
    "radioatelier/package/infrastructure/ulid"
    "radioatelier/package/usecase/presenter"
)

type Category struct {
    ID   ulid.ULID `json:"id" validate:"ulid"`
    Name string    `json:"name"`
}

type Tag struct {
    ID   ulid.ULID `json:"id" validate:"ulid"`
    Name string    `json:"name"`
}

type Cover struct {
    ID         ulid.ULID `json:"id" validate:"ulid"`
    URL        string    `json:"url"`
    PreviewURL string    `json:"previewUrl"`
}

func getCategory(object presenter.Object) (Category, error) {
    category, err := object.GetCategory()
    if err != nil {
        return Category{}, err
    }

    return Category{ID: category.GetModel().ID, Name: category.GetModel().Name}, nil
}

func getTags(object presenter.Object) ([]Tag, error) {
    tags, err := object.GetTags()
    if err != nil {
        return []Tag{}, err
    }

    tagsResult := []Tag{}
    for _, tag := range tags {
        tagsResult = append(tagsResult, Tag{ID: tag.GetModel().ID, Name: tag.GetModel().Name})
    }

    return tagsResult, nil
}

func getPrivateTags(object presenter.Object, user presenter.User) ([]Tag, error) {
    privateTags, err := object.GetPrivateTags(user)
    if err != nil {
        return []Tag{}, err
    }

    privateTagsResult := []Tag{}
    for _, privateTag := range privateTags {
        privateTagsResult = append(privateTagsResult, Tag{ID: privateTag.GetModel().ID, Name: privateTag.GetModel().Name})
    }

    return privateTagsResult, nil
}

func getCover(object presenter.Object) (*Cover, error) {
    cover, err := object.GetCover()
    if err != nil {
        return nil, err
    }
    if cover == nil {
        return nil, nil
    }
    return &Cover{ID: cover.GetModel().ID, URL: cover.GetModel().Link, PreviewURL: cover.GetModel().PreviewLink}, nil
}
