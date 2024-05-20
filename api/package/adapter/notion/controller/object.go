package controller

import (
    "context"

    "radioatelier/package/adapter/notion/model"
    "radioatelier/package/adapter/notion/repository"
    "radioatelier/package/adapter/notion/request"
    "radioatelier/package/config"
)

type object struct {
    repo repository.Object
}

type Object interface {
    //Get(ctx context.Context, id model.ID) (*model.Object, error)
    //List(ctx context.Context, after *model.Cursor, first *int, before *model.Cursor, last *int, orderBy *model.ObjectOrder, where *model.ObjectWhereInput) (*model.ObjectConnection, error)
    Create(ctx context.Context, obj *model.Object) (*model.Object, error)
    //Update(ctx context.Context, id model.ID, input model.UpdateObjectInput) (*model.Object, error)
    //Delete(ctx context.Context, id model.ID) (model.ID, error)
}

func NewObjectController(repo repository.Object) Object {
    return &object{repo}
}

func (c *object) Create(ctx context.Context, obj *model.Object) (*model.Object, error) {
    req := request.NewCreateRequest()
    req.SetParent(config.Get().NotionObjectsDBID)
    req.AddProperty(string(model.Name), obj.Name)
}
