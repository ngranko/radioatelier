package repository

import (
    "github.com/google/uuid"

    "radioatelier/package/adapter/db/model"
    "radioatelier/package/infrastructure/db"
)

type objectRepo struct {
    client *db.Client
}

type Object interface {
    Repository[model.Object]
    GetList(userID uuid.UUID) ([]model.Object, error)
    GetByID(id uuid.UUID) (*model.Object, error)
    GetTags(object *model.Object) ([]*model.Tag, error)
    SetTags(object *model.Object, tags []uuid.UUID) error
    GetPrivateTags(object *model.Object, user *model.User) ([]*model.PrivateTag, error)
    SetPrivateTags(object *model.Object, user *model.User, tags []uuid.UUID) error
}

func NewObjectRepository(client *db.Client) Object {
    return &objectRepo{
        client: client,
    }
}

func (r *objectRepo) GetList(userID uuid.UUID) ([]model.Object, error) {
    var list []model.Object
    err := r.client.
        Model(&model.Object{}).
        Select("id", "latitude", "longitude").
        Where(&model.Object{IsPublic: true}).
        Or(&model.Object{CreatedBy: userID}).
        Find(&list).
        Error
    return list, err
}

func (r *objectRepo) GetByID(id uuid.UUID) (*model.Object, error) {
    object := model.Object{Base: model.Base{ID: id}}
    err := r.client.Where(&object).First(&object).Error
    return &object, err
}

func (r *objectRepo) Create(object *model.Object) error {
    return r.client.Create(object).Error
}

func (r *objectRepo) Save(object *model.Object) error {
    return r.client.Save(object).Error
}

func (r *objectRepo) Delete(object *model.Object) error {
    return r.client.Delete(object).Error
}

func (r *objectRepo) GetTags(object *model.Object) ([]*model.Tag, error) {
    var tags []*model.Tag
    err := r.client.Model(object).Association("Tags").Find(&tags)
    return tags, err
}

func (r *objectRepo) SetTags(object *model.Object, tags []uuid.UUID) error {
    var tagList []model.Tag
    for _, tag := range tags {
        tagList = append(tagList, model.Tag{Base: model.Base{ID: tag}})
    }
    return r.client.Model(object).Association("Tags").Replace(&tagList)
}

func (r *objectRepo) GetPrivateTags(object *model.Object, user *model.User) ([]*model.PrivateTag, error) {
    var tags []*model.PrivateTag

    err := r.client.Model(object).
        Joins("inner join object_private_tags opt on objects.id = opt.object_id").
        Joins("inner join private_tags pt on opt.private_tag_id = pt.id").
        Where("pt.created_by = ? and objects.id = ?", user.ID, object.ID).
        Select("pt.*").
        Find(&tags).
        Error
    return tags, err
}

func (r *objectRepo) SetPrivateTags(object *model.Object, user *model.User, tags []uuid.UUID) error {
    err := r.client.Exec("delete from object_private_tags where object_id = ? and private_tag_id in (select id from private_tags where created_by = ?)", object.ID, user.ID).Error
    if err != nil {
        return err
    }

    var tagList []model.PrivateTag
    for _, tag := range tags {
        tagList = append(tagList, model.PrivateTag{Base: model.Base{ID: tag}})
    }
    return r.client.Model(object).Association("PrivateTags").Append(&tagList)
}
