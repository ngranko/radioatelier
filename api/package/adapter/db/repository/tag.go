package repository

import (
    "radioatelier/package/adapter/db/model"
    "radioatelier/package/infrastructure/db"
)

type tagRepo struct {
    client *db.Client
}

type Tag interface {
    Repository[model.Tag]
    GetList() ([]model.Tag, error)
    GetByName(name string) (model.Tag, error)
}

func NewTagRepository(client *db.Client) Tag {
    return &tagRepo{
        client: client,
    }
}

func (r *tagRepo) GetList() ([]model.Tag, error) {
    var list []model.Tag
    err := r.client.Model(&model.Tag{}).Select("id", "name").Find(&list).Error
    return list, err
}

func (r *tagRepo) GetByName(name string) (model.Tag, error) {
    tag := model.Tag{Name: name}
    err := r.client.Where(&tag).First(&tag).Error
    return tag, err
}

func (r *tagRepo) Create(tag *model.Tag) error {
    return r.client.Create(tag).Error
}

func (r *tagRepo) Save(tag *model.Tag) error {
    return r.client.Save(tag).Error
}

func (r *tagRepo) Delete(tag *model.Tag) error {
    return r.client.Delete(tag).Error
}
