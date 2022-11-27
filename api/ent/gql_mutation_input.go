// Code generated by ent, DO NOT EDIT.

package ent

import (
	"radioatelier/ent/schema/puuid"
	"time"
)

// CreateCityInput represents a mutation input for creating cities.
type CreateCityInput struct {
	Name      string
	Country   string
	ObjectIDs []puuid.ID
}

// Mutate applies the CreateCityInput on the CityMutation builder.
func (i *CreateCityInput) Mutate(m *CityMutation) {
	m.SetName(i.Name)
	m.SetCountry(i.Country)
	if v := i.ObjectIDs; len(v) > 0 {
		m.AddObjectIDs(v...)
	}
}

// SetInput applies the change-set in the CreateCityInput on the CityCreate builder.
func (c *CityCreate) SetInput(i CreateCityInput) *CityCreate {
	i.Mutate(c.Mutation())
	return c
}

// UpdateCityInput represents a mutation input for updating cities.
type UpdateCityInput struct {
	Name            *string
	Country         *string
	AddObjectIDs    []puuid.ID
	RemoveObjectIDs []puuid.ID
}

// Mutate applies the UpdateCityInput on the CityMutation builder.
func (i *UpdateCityInput) Mutate(m *CityMutation) {
	if v := i.Name; v != nil {
		m.SetName(*v)
	}
	if v := i.Country; v != nil {
		m.SetCountry(*v)
	}
	if v := i.AddObjectIDs; len(v) > 0 {
		m.AddObjectIDs(v...)
	}
	if v := i.RemoveObjectIDs; len(v) > 0 {
		m.RemoveObjectIDs(v...)
	}
}

// SetInput applies the change-set in the UpdateCityInput on the CityUpdate builder.
func (c *CityUpdate) SetInput(i UpdateCityInput) *CityUpdate {
	i.Mutate(c.Mutation())
	return c
}

// SetInput applies the change-set in the UpdateCityInput on the CityUpdateOne builder.
func (c *CityUpdateOne) SetInput(i UpdateCityInput) *CityUpdateOne {
	i.Mutate(c.Mutation())
	return c
}

// CreateCollectionInput represents a mutation input for creating collections.
type CreateCollectionInput struct {
	Name        string
	Description *string
	CreatedAt   *time.Time
	UpdatedAt   *time.Time
	CreatedByID puuid.ID
	UpdatedByID puuid.ID
	ObjectIDs   []puuid.ID
	UserIDs     []puuid.ID
}

// Mutate applies the CreateCollectionInput on the CollectionMutation builder.
func (i *CreateCollectionInput) Mutate(m *CollectionMutation) {
	m.SetName(i.Name)
	if v := i.Description; v != nil {
		m.SetDescription(*v)
	}
	if v := i.CreatedAt; v != nil {
		m.SetCreatedAt(*v)
	}
	if v := i.UpdatedAt; v != nil {
		m.SetUpdatedAt(*v)
	}
	m.SetCreatedByID(i.CreatedByID)
	m.SetUpdatedByID(i.UpdatedByID)
	if v := i.ObjectIDs; len(v) > 0 {
		m.AddObjectIDs(v...)
	}
	if v := i.UserIDs; len(v) > 0 {
		m.AddUserIDs(v...)
	}
}

// SetInput applies the change-set in the CreateCollectionInput on the CollectionCreate builder.
func (c *CollectionCreate) SetInput(i CreateCollectionInput) *CollectionCreate {
	i.Mutate(c.Mutation())
	return c
}

// UpdateCollectionInput represents a mutation input for updating collections.
type UpdateCollectionInput struct {
	Name             *string
	ClearDescription bool
	Description      *string
	UpdatedAt        *time.Time
	ClearCreatedBy   bool
	CreatedByID      *puuid.ID
	ClearUpdatedBy   bool
	UpdatedByID      *puuid.ID
	AddObjectIDs     []puuid.ID
	RemoveObjectIDs  []puuid.ID
	AddUserIDs       []puuid.ID
	RemoveUserIDs    []puuid.ID
}

// Mutate applies the UpdateCollectionInput on the CollectionMutation builder.
func (i *UpdateCollectionInput) Mutate(m *CollectionMutation) {
	if v := i.Name; v != nil {
		m.SetName(*v)
	}
	if i.ClearDescription {
		m.ClearDescription()
	}
	if v := i.Description; v != nil {
		m.SetDescription(*v)
	}
	if v := i.UpdatedAt; v != nil {
		m.SetUpdatedAt(*v)
	}
	if i.ClearCreatedBy {
		m.ClearCreatedBy()
	}
	if v := i.CreatedByID; v != nil {
		m.SetCreatedByID(*v)
	}
	if i.ClearUpdatedBy {
		m.ClearUpdatedBy()
	}
	if v := i.UpdatedByID; v != nil {
		m.SetUpdatedByID(*v)
	}
	if v := i.AddObjectIDs; len(v) > 0 {
		m.AddObjectIDs(v...)
	}
	if v := i.RemoveObjectIDs; len(v) > 0 {
		m.RemoveObjectIDs(v...)
	}
	if v := i.AddUserIDs; len(v) > 0 {
		m.AddUserIDs(v...)
	}
	if v := i.RemoveUserIDs; len(v) > 0 {
		m.RemoveUserIDs(v...)
	}
}

// SetInput applies the change-set in the UpdateCollectionInput on the CollectionUpdate builder.
func (c *CollectionUpdate) SetInput(i UpdateCollectionInput) *CollectionUpdate {
	i.Mutate(c.Mutation())
	return c
}

// SetInput applies the change-set in the UpdateCollectionInput on the CollectionUpdateOne builder.
func (c *CollectionUpdateOne) SetInput(i UpdateCollectionInput) *CollectionUpdateOne {
	i.Mutate(c.Mutation())
	return c
}

// CreateObjectInput represents a mutation input for creating objects.
type CreateObjectInput struct {
	Name            string
	Address         *string
	Description     *string
	Lat             *float64
	Lng             *float64
	InstalledPeriod *string
	IsRemoved       *bool
	RemovedPeriod   *string
	Source          *string
	Type            string
	Tags            string
	CreatedAt       *time.Time
	UpdatedAt       *time.Time
	DeletedAt       *time.Time
	LastSync        *time.Time
	NotionID        *string
	CreatedByID     puuid.ID
	UpdatedByID     puuid.ID
	DeletedByID     *puuid.ID
	CollectionIDs   []puuid.ID
	UserInfoIDs     []puuid.ID
	CityID          puuid.ID
}

// Mutate applies the CreateObjectInput on the ObjectMutation builder.
func (i *CreateObjectInput) Mutate(m *ObjectMutation) {
	m.SetName(i.Name)
	if v := i.Address; v != nil {
		m.SetAddress(*v)
	}
	if v := i.Description; v != nil {
		m.SetDescription(*v)
	}
	if v := i.Lat; v != nil {
		m.SetLat(*v)
	}
	if v := i.Lng; v != nil {
		m.SetLng(*v)
	}
	if v := i.InstalledPeriod; v != nil {
		m.SetInstalledPeriod(*v)
	}
	if v := i.IsRemoved; v != nil {
		m.SetIsRemoved(*v)
	}
	if v := i.RemovedPeriod; v != nil {
		m.SetRemovedPeriod(*v)
	}
	if v := i.Source; v != nil {
		m.SetSource(*v)
	}
	m.SetType(i.Type)
	m.SetTags(i.Tags)
	if v := i.CreatedAt; v != nil {
		m.SetCreatedAt(*v)
	}
	if v := i.UpdatedAt; v != nil {
		m.SetUpdatedAt(*v)
	}
	if v := i.DeletedAt; v != nil {
		m.SetDeletedAt(*v)
	}
	if v := i.LastSync; v != nil {
		m.SetLastSync(*v)
	}
	if v := i.NotionID; v != nil {
		m.SetNotionID(*v)
	}
	m.SetCreatedByID(i.CreatedByID)
	m.SetUpdatedByID(i.UpdatedByID)
	if v := i.DeletedByID; v != nil {
		m.SetDeletedByID(*v)
	}
	if v := i.CollectionIDs; len(v) > 0 {
		m.AddCollectionIDs(v...)
	}
	if v := i.UserInfoIDs; len(v) > 0 {
		m.AddUserInfoIDs(v...)
	}
	m.SetCityID(i.CityID)
}

// SetInput applies the change-set in the CreateObjectInput on the ObjectCreate builder.
func (c *ObjectCreate) SetInput(i CreateObjectInput) *ObjectCreate {
	i.Mutate(c.Mutation())
	return c
}

// UpdateObjectInput represents a mutation input for updating objects.
type UpdateObjectInput struct {
	Name                 *string
	ClearAddress         bool
	Address              *string
	ClearDescription     bool
	Description          *string
	ClearLat             bool
	Lat                  *float64
	ClearLng             bool
	Lng                  *float64
	ClearInstalledPeriod bool
	InstalledPeriod      *string
	IsRemoved            *bool
	ClearRemovedPeriod   bool
	RemovedPeriod        *string
	ClearSource          bool
	Source               *string
	Type                 *string
	Tags                 *string
	UpdatedAt            *time.Time
	ClearDeletedAt       bool
	DeletedAt            *time.Time
	ClearLastSync        bool
	LastSync             *time.Time
	ClearNotionID        bool
	NotionID             *string
	ClearCreatedBy       bool
	CreatedByID          *puuid.ID
	ClearUpdatedBy       bool
	UpdatedByID          *puuid.ID
	ClearDeletedBy       bool
	DeletedByID          *puuid.ID
	AddCollectionIDs     []puuid.ID
	RemoveCollectionIDs  []puuid.ID
	AddUserInfoIDs       []puuid.ID
	RemoveUserInfoIDs    []puuid.ID
	ClearCity            bool
	CityID               *puuid.ID
}

// Mutate applies the UpdateObjectInput on the ObjectMutation builder.
func (i *UpdateObjectInput) Mutate(m *ObjectMutation) {
	if v := i.Name; v != nil {
		m.SetName(*v)
	}
	if i.ClearAddress {
		m.ClearAddress()
	}
	if v := i.Address; v != nil {
		m.SetAddress(*v)
	}
	if i.ClearDescription {
		m.ClearDescription()
	}
	if v := i.Description; v != nil {
		m.SetDescription(*v)
	}
	if i.ClearLat {
		m.ClearLat()
	}
	if v := i.Lat; v != nil {
		m.SetLat(*v)
	}
	if i.ClearLng {
		m.ClearLng()
	}
	if v := i.Lng; v != nil {
		m.SetLng(*v)
	}
	if i.ClearInstalledPeriod {
		m.ClearInstalledPeriod()
	}
	if v := i.InstalledPeriod; v != nil {
		m.SetInstalledPeriod(*v)
	}
	if v := i.IsRemoved; v != nil {
		m.SetIsRemoved(*v)
	}
	if i.ClearRemovedPeriod {
		m.ClearRemovedPeriod()
	}
	if v := i.RemovedPeriod; v != nil {
		m.SetRemovedPeriod(*v)
	}
	if i.ClearSource {
		m.ClearSource()
	}
	if v := i.Source; v != nil {
		m.SetSource(*v)
	}
	if v := i.Type; v != nil {
		m.SetType(*v)
	}
	if v := i.Tags; v != nil {
		m.SetTags(*v)
	}
	if v := i.UpdatedAt; v != nil {
		m.SetUpdatedAt(*v)
	}
	if i.ClearDeletedAt {
		m.ClearDeletedAt()
	}
	if v := i.DeletedAt; v != nil {
		m.SetDeletedAt(*v)
	}
	if i.ClearLastSync {
		m.ClearLastSync()
	}
	if v := i.LastSync; v != nil {
		m.SetLastSync(*v)
	}
	if i.ClearNotionID {
		m.ClearNotionID()
	}
	if v := i.NotionID; v != nil {
		m.SetNotionID(*v)
	}
	if i.ClearCreatedBy {
		m.ClearCreatedBy()
	}
	if v := i.CreatedByID; v != nil {
		m.SetCreatedByID(*v)
	}
	if i.ClearUpdatedBy {
		m.ClearUpdatedBy()
	}
	if v := i.UpdatedByID; v != nil {
		m.SetUpdatedByID(*v)
	}
	if i.ClearDeletedBy {
		m.ClearDeletedBy()
	}
	if v := i.DeletedByID; v != nil {
		m.SetDeletedByID(*v)
	}
	if v := i.AddCollectionIDs; len(v) > 0 {
		m.AddCollectionIDs(v...)
	}
	if v := i.RemoveCollectionIDs; len(v) > 0 {
		m.RemoveCollectionIDs(v...)
	}
	if v := i.AddUserInfoIDs; len(v) > 0 {
		m.AddUserInfoIDs(v...)
	}
	if v := i.RemoveUserInfoIDs; len(v) > 0 {
		m.RemoveUserInfoIDs(v...)
	}
	if i.ClearCity {
		m.ClearCity()
	}
	if v := i.CityID; v != nil {
		m.SetCityID(*v)
	}
}

// SetInput applies the change-set in the UpdateObjectInput on the ObjectUpdate builder.
func (c *ObjectUpdate) SetInput(i UpdateObjectInput) *ObjectUpdate {
	i.Mutate(c.Mutation())
	return c
}

// SetInput applies the change-set in the UpdateObjectInput on the ObjectUpdateOne builder.
func (c *ObjectUpdateOne) SetInput(i UpdateObjectInput) *ObjectUpdateOne {
	i.Mutate(c.Mutation())
	return c
}

// UpdateObjectUserInput represents a mutation input for updating objectusers.
type UpdateObjectUserInput struct {
	IsVisited      *bool
	ClearLastVisit bool
	LastVisit      *time.Time
	ClearUser      bool
	UserID         *puuid.ID
	ClearObject    bool
	ObjectID       *puuid.ID
}

// Mutate applies the UpdateObjectUserInput on the ObjectUserMutation builder.
func (i *UpdateObjectUserInput) Mutate(m *ObjectUserMutation) {
	if v := i.IsVisited; v != nil {
		m.SetIsVisited(*v)
	}
	if i.ClearLastVisit {
		m.ClearLastVisit()
	}
	if v := i.LastVisit; v != nil {
		m.SetLastVisit(*v)
	}
	if i.ClearUser {
		m.ClearUser()
	}
	if v := i.UserID; v != nil {
		m.SetUserID(*v)
	}
	if i.ClearObject {
		m.ClearObject()
	}
	if v := i.ObjectID; v != nil {
		m.SetObjectID(*v)
	}
}

// SetInput applies the change-set in the UpdateObjectUserInput on the ObjectUserUpdate builder.
func (c *ObjectUserUpdate) SetInput(i UpdateObjectUserInput) *ObjectUserUpdate {
	i.Mutate(c.Mutation())
	return c
}

// SetInput applies the change-set in the UpdateObjectUserInput on the ObjectUserUpdateOne builder.
func (c *ObjectUserUpdateOne) SetInput(i UpdateObjectUserInput) *ObjectUserUpdateOne {
	i.Mutate(c.Mutation())
	return c
}

// CreateUserInput represents a mutation input for creating users.
type CreateUserInput struct {
	Name                 string
	Email                string
	Login                string
	Password             string
	Role                 string
	LastLogin            *time.Time
	IsActive             *bool
	NotionID             *string
	IsNotionSubject      *bool
	CreatedObjectIDs     []puuid.ID
	UpdatedObjectIDs     []puuid.ID
	DeletedObjectIDs     []puuid.ID
	CreatedCollectionIDs []puuid.ID
	UpdatedCollectionIDs []puuid.ID
	CollectionIDs        []puuid.ID
	ObjectInfoIDs        []puuid.ID
}

// Mutate applies the CreateUserInput on the UserMutation builder.
func (i *CreateUserInput) Mutate(m *UserMutation) {
	m.SetName(i.Name)
	m.SetEmail(i.Email)
	m.SetLogin(i.Login)
	m.SetPassword(i.Password)
	m.SetRole(i.Role)
	if v := i.LastLogin; v != nil {
		m.SetLastLogin(*v)
	}
	if v := i.IsActive; v != nil {
		m.SetIsActive(*v)
	}
	if v := i.NotionID; v != nil {
		m.SetNotionID(*v)
	}
	if v := i.IsNotionSubject; v != nil {
		m.SetIsNotionSubject(*v)
	}
	if v := i.CreatedObjectIDs; len(v) > 0 {
		m.AddCreatedObjectIDs(v...)
	}
	if v := i.UpdatedObjectIDs; len(v) > 0 {
		m.AddUpdatedObjectIDs(v...)
	}
	if v := i.DeletedObjectIDs; len(v) > 0 {
		m.AddDeletedObjectIDs(v...)
	}
	if v := i.CreatedCollectionIDs; len(v) > 0 {
		m.AddCreatedCollectionIDs(v...)
	}
	if v := i.UpdatedCollectionIDs; len(v) > 0 {
		m.AddUpdatedCollectionIDs(v...)
	}
	if v := i.CollectionIDs; len(v) > 0 {
		m.AddCollectionIDs(v...)
	}
	if v := i.ObjectInfoIDs; len(v) > 0 {
		m.AddObjectInfoIDs(v...)
	}
}

// SetInput applies the change-set in the CreateUserInput on the UserCreate builder.
func (c *UserCreate) SetInput(i CreateUserInput) *UserCreate {
	i.Mutate(c.Mutation())
	return c
}

// UpdateUserInput represents a mutation input for updating users.
type UpdateUserInput struct {
	Name                       *string
	Email                      *string
	Login                      *string
	Password                   *string
	Role                       *string
	ClearLastLogin             bool
	LastLogin                  *time.Time
	IsActive                   *bool
	ClearNotionID              bool
	NotionID                   *string
	IsNotionSubject            *bool
	AddCreatedObjectIDs        []puuid.ID
	RemoveCreatedObjectIDs     []puuid.ID
	AddUpdatedObjectIDs        []puuid.ID
	RemoveUpdatedObjectIDs     []puuid.ID
	AddDeletedObjectIDs        []puuid.ID
	RemoveDeletedObjectIDs     []puuid.ID
	AddCreatedCollectionIDs    []puuid.ID
	RemoveCreatedCollectionIDs []puuid.ID
	AddUpdatedCollectionIDs    []puuid.ID
	RemoveUpdatedCollectionIDs []puuid.ID
	AddCollectionIDs           []puuid.ID
	RemoveCollectionIDs        []puuid.ID
	AddObjectInfoIDs           []puuid.ID
	RemoveObjectInfoIDs        []puuid.ID
}

// Mutate applies the UpdateUserInput on the UserMutation builder.
func (i *UpdateUserInput) Mutate(m *UserMutation) {
	if v := i.Name; v != nil {
		m.SetName(*v)
	}
	if v := i.Email; v != nil {
		m.SetEmail(*v)
	}
	if v := i.Login; v != nil {
		m.SetLogin(*v)
	}
	if v := i.Password; v != nil {
		m.SetPassword(*v)
	}
	if v := i.Role; v != nil {
		m.SetRole(*v)
	}
	if i.ClearLastLogin {
		m.ClearLastLogin()
	}
	if v := i.LastLogin; v != nil {
		m.SetLastLogin(*v)
	}
	if v := i.IsActive; v != nil {
		m.SetIsActive(*v)
	}
	if i.ClearNotionID {
		m.ClearNotionID()
	}
	if v := i.NotionID; v != nil {
		m.SetNotionID(*v)
	}
	if v := i.IsNotionSubject; v != nil {
		m.SetIsNotionSubject(*v)
	}
	if v := i.AddCreatedObjectIDs; len(v) > 0 {
		m.AddCreatedObjectIDs(v...)
	}
	if v := i.RemoveCreatedObjectIDs; len(v) > 0 {
		m.RemoveCreatedObjectIDs(v...)
	}
	if v := i.AddUpdatedObjectIDs; len(v) > 0 {
		m.AddUpdatedObjectIDs(v...)
	}
	if v := i.RemoveUpdatedObjectIDs; len(v) > 0 {
		m.RemoveUpdatedObjectIDs(v...)
	}
	if v := i.AddDeletedObjectIDs; len(v) > 0 {
		m.AddDeletedObjectIDs(v...)
	}
	if v := i.RemoveDeletedObjectIDs; len(v) > 0 {
		m.RemoveDeletedObjectIDs(v...)
	}
	if v := i.AddCreatedCollectionIDs; len(v) > 0 {
		m.AddCreatedCollectionIDs(v...)
	}
	if v := i.RemoveCreatedCollectionIDs; len(v) > 0 {
		m.RemoveCreatedCollectionIDs(v...)
	}
	if v := i.AddUpdatedCollectionIDs; len(v) > 0 {
		m.AddUpdatedCollectionIDs(v...)
	}
	if v := i.RemoveUpdatedCollectionIDs; len(v) > 0 {
		m.RemoveUpdatedCollectionIDs(v...)
	}
	if v := i.AddCollectionIDs; len(v) > 0 {
		m.AddCollectionIDs(v...)
	}
	if v := i.RemoveCollectionIDs; len(v) > 0 {
		m.RemoveCollectionIDs(v...)
	}
	if v := i.AddObjectInfoIDs; len(v) > 0 {
		m.AddObjectInfoIDs(v...)
	}
	if v := i.RemoveObjectInfoIDs; len(v) > 0 {
		m.RemoveObjectInfoIDs(v...)
	}
}

// SetInput applies the change-set in the UpdateUserInput on the UserUpdate builder.
func (c *UserUpdate) SetInput(i UpdateUserInput) *UserUpdate {
	i.Mutate(c.Mutation())
	return c
}

// SetInput applies the change-set in the UpdateUserInput on the UserUpdateOne builder.
func (c *UserUpdateOne) SetInput(i UpdateUserInput) *UserUpdateOne {
	i.Mutate(c.Mutation())
	return c
}
