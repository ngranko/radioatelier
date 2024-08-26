package object

import (
    "github.com/google/uuid"

    "radioatelier/package/usecase/presenter"
)

type Category struct {
    ID   uuid.UUID `json:"id" validate:"uuid"`
    Name string    `json:"name"`
}

type Tag struct {
    ID   uuid.UUID `json:"id" validate:"uuid"`
    Name string    `json:"name"`
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

    var tagsResult []Tag
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

    var privateTagsResult []Tag
    for _, privateTag := range privateTags {
        privateTagsResult = append(privateTagsResult, Tag{ID: privateTag.GetModel().ID, Name: privateTag.GetModel().Name})
    }

    return privateTagsResult, nil
}
