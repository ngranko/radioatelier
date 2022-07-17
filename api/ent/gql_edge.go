// Code generated by ent, DO NOT EDIT.

package ent

import "context"

func (c *City) Objects(ctx context.Context) ([]*Object, error) {
	result, err := c.Edges.ObjectsOrErr()
	if IsNotLoaded(err) {
		result, err = c.QueryObjects().All(ctx)
	}
	return result, err
}

func (c *Collection) CreatedBy(ctx context.Context) (*User, error) {
	result, err := c.Edges.CreatedByOrErr()
	if IsNotLoaded(err) {
		result, err = c.QueryCreatedBy().Only(ctx)
	}
	return result, err
}

func (c *Collection) UpdatedBy(ctx context.Context) (*User, error) {
	result, err := c.Edges.UpdatedByOrErr()
	if IsNotLoaded(err) {
		result, err = c.QueryUpdatedBy().Only(ctx)
	}
	return result, err
}

func (c *Collection) Objects(ctx context.Context) ([]*Object, error) {
	result, err := c.Edges.ObjectsOrErr()
	if IsNotLoaded(err) {
		result, err = c.QueryObjects().All(ctx)
	}
	return result, err
}

func (c *Collection) Users(ctx context.Context) ([]*User, error) {
	result, err := c.Edges.UsersOrErr()
	if IsNotLoaded(err) {
		result, err = c.QueryUsers().All(ctx)
	}
	return result, err
}

func (o *Object) CreatedBy(ctx context.Context) (*User, error) {
	result, err := o.Edges.CreatedByOrErr()
	if IsNotLoaded(err) {
		result, err = o.QueryCreatedBy().Only(ctx)
	}
	return result, err
}

func (o *Object) UpdatedBy(ctx context.Context) (*User, error) {
	result, err := o.Edges.UpdatedByOrErr()
	if IsNotLoaded(err) {
		result, err = o.QueryUpdatedBy().Only(ctx)
	}
	return result, err
}

func (o *Object) DeletedBy(ctx context.Context) (*User, error) {
	result, err := o.Edges.DeletedByOrErr()
	if IsNotLoaded(err) {
		result, err = o.QueryDeletedBy().Only(ctx)
	}
	return result, MaskNotFound(err)
}

func (o *Object) Collections(ctx context.Context) ([]*Collection, error) {
	result, err := o.Edges.CollectionsOrErr()
	if IsNotLoaded(err) {
		result, err = o.QueryCollections().All(ctx)
	}
	return result, err
}

func (o *Object) UserInfo(ctx context.Context) ([]*User, error) {
	result, err := o.Edges.UserInfoOrErr()
	if IsNotLoaded(err) {
		result, err = o.QueryUserInfo().All(ctx)
	}
	return result, err
}

func (o *Object) City(ctx context.Context) (*City, error) {
	result, err := o.Edges.CityOrErr()
	if IsNotLoaded(err) {
		result, err = o.QueryCity().Only(ctx)
	}
	return result, err
}

func (u *User) CreatedObjects(ctx context.Context) ([]*Object, error) {
	result, err := u.Edges.CreatedObjectsOrErr()
	if IsNotLoaded(err) {
		result, err = u.QueryCreatedObjects().All(ctx)
	}
	return result, err
}

func (u *User) UpdatedObjects(ctx context.Context) ([]*Object, error) {
	result, err := u.Edges.UpdatedObjectsOrErr()
	if IsNotLoaded(err) {
		result, err = u.QueryUpdatedObjects().All(ctx)
	}
	return result, err
}

func (u *User) DeletedObjects(ctx context.Context) ([]*Object, error) {
	result, err := u.Edges.DeletedObjectsOrErr()
	if IsNotLoaded(err) {
		result, err = u.QueryDeletedObjects().All(ctx)
	}
	return result, err
}

func (u *User) CreatedCollections(ctx context.Context) ([]*Collection, error) {
	result, err := u.Edges.CreatedCollectionsOrErr()
	if IsNotLoaded(err) {
		result, err = u.QueryCreatedCollections().All(ctx)
	}
	return result, err
}

func (u *User) UpdatedCollections(ctx context.Context) ([]*Collection, error) {
	result, err := u.Edges.UpdatedCollectionsOrErr()
	if IsNotLoaded(err) {
		result, err = u.QueryUpdatedCollections().All(ctx)
	}
	return result, err
}

func (u *User) Collections(ctx context.Context) ([]*Collection, error) {
	result, err := u.Edges.CollectionsOrErr()
	if IsNotLoaded(err) {
		result, err = u.QueryCollections().All(ctx)
	}
	return result, err
}

func (u *User) ObjectInfo(ctx context.Context) ([]*Object, error) {
	result, err := u.Edges.ObjectInfoOrErr()
	if IsNotLoaded(err) {
		result, err = u.QueryObjectInfo().All(ctx)
	}
	return result, err
}
