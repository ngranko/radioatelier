// Code generated by ent, DO NOT EDIT.

package user

import (
	"radioatelier/ent/schema/puuid"
)

const (
	// Label holds the string label denoting the user type in the database.
	Label = "user"
	// FieldID holds the string denoting the id field in the database.
	FieldID = "id"
	// FieldName holds the string denoting the name field in the database.
	FieldName = "name"
	// FieldEmail holds the string denoting the email field in the database.
	FieldEmail = "email"
	// FieldLogin holds the string denoting the login field in the database.
	FieldLogin = "login"
	// FieldPassword holds the string denoting the password field in the database.
	FieldPassword = "password"
	// FieldRole holds the string denoting the role field in the database.
	FieldRole = "role"
	// FieldLastLogin holds the string denoting the last_login field in the database.
	FieldLastLogin = "last_login"
	// FieldIsActive holds the string denoting the is_active field in the database.
	FieldIsActive = "is_active"
	// FieldNotionID holds the string denoting the notion_id field in the database.
	FieldNotionID = "notion_id"
	// FieldIsNotionSubject holds the string denoting the is_notion_subject field in the database.
	FieldIsNotionSubject = "is_notion_subject"
	// EdgeCreatedObjects holds the string denoting the created_objects edge name in mutations.
	EdgeCreatedObjects = "created_objects"
	// EdgeUpdatedObjects holds the string denoting the updated_objects edge name in mutations.
	EdgeUpdatedObjects = "updated_objects"
	// EdgeDeletedObjects holds the string denoting the deleted_objects edge name in mutations.
	EdgeDeletedObjects = "deleted_objects"
	// EdgeCreatedCollections holds the string denoting the created_collections edge name in mutations.
	EdgeCreatedCollections = "created_collections"
	// EdgeUpdatedCollections holds the string denoting the updated_collections edge name in mutations.
	EdgeUpdatedCollections = "updated_collections"
	// EdgeCollections holds the string denoting the collections edge name in mutations.
	EdgeCollections = "collections"
	// EdgeObjectInfo holds the string denoting the object_info edge name in mutations.
	EdgeObjectInfo = "object_info"
	// EdgeObjectUser holds the string denoting the object_user edge name in mutations.
	EdgeObjectUser = "object_user"
	// Table holds the table name of the user in the database.
	Table = "users"
	// CreatedObjectsTable is the table that holds the created_objects relation/edge.
	CreatedObjectsTable = "objects"
	// CreatedObjectsInverseTable is the table name for the Object entity.
	// It exists in this package in order to avoid circular dependency with the "object" package.
	CreatedObjectsInverseTable = "objects"
	// CreatedObjectsColumn is the table column denoting the created_objects relation/edge.
	CreatedObjectsColumn = "created_by"
	// UpdatedObjectsTable is the table that holds the updated_objects relation/edge.
	UpdatedObjectsTable = "objects"
	// UpdatedObjectsInverseTable is the table name for the Object entity.
	// It exists in this package in order to avoid circular dependency with the "object" package.
	UpdatedObjectsInverseTable = "objects"
	// UpdatedObjectsColumn is the table column denoting the updated_objects relation/edge.
	UpdatedObjectsColumn = "updated_by"
	// DeletedObjectsTable is the table that holds the deleted_objects relation/edge.
	DeletedObjectsTable = "objects"
	// DeletedObjectsInverseTable is the table name for the Object entity.
	// It exists in this package in order to avoid circular dependency with the "object" package.
	DeletedObjectsInverseTable = "objects"
	// DeletedObjectsColumn is the table column denoting the deleted_objects relation/edge.
	DeletedObjectsColumn = "deleted_by"
	// CreatedCollectionsTable is the table that holds the created_collections relation/edge.
	CreatedCollectionsTable = "collections"
	// CreatedCollectionsInverseTable is the table name for the Collection entity.
	// It exists in this package in order to avoid circular dependency with the "collection" package.
	CreatedCollectionsInverseTable = "collections"
	// CreatedCollectionsColumn is the table column denoting the created_collections relation/edge.
	CreatedCollectionsColumn = "created_by"
	// UpdatedCollectionsTable is the table that holds the updated_collections relation/edge.
	UpdatedCollectionsTable = "collections"
	// UpdatedCollectionsInverseTable is the table name for the Collection entity.
	// It exists in this package in order to avoid circular dependency with the "collection" package.
	UpdatedCollectionsInverseTable = "collections"
	// UpdatedCollectionsColumn is the table column denoting the updated_collections relation/edge.
	UpdatedCollectionsColumn = "updated_by"
	// CollectionsTable is the table that holds the collections relation/edge. The primary key declared below.
	CollectionsTable = "user_collections"
	// CollectionsInverseTable is the table name for the Collection entity.
	// It exists in this package in order to avoid circular dependency with the "collection" package.
	CollectionsInverseTable = "collections"
	// ObjectInfoTable is the table that holds the object_info relation/edge. The primary key declared below.
	ObjectInfoTable = "object_users"
	// ObjectInfoInverseTable is the table name for the Object entity.
	// It exists in this package in order to avoid circular dependency with the "object" package.
	ObjectInfoInverseTable = "objects"
	// ObjectUserTable is the table that holds the object_user relation/edge.
	ObjectUserTable = "object_users"
	// ObjectUserInverseTable is the table name for the ObjectUser entity.
	// It exists in this package in order to avoid circular dependency with the "objectuser" package.
	ObjectUserInverseTable = "object_users"
	// ObjectUserColumn is the table column denoting the object_user relation/edge.
	ObjectUserColumn = "user_id"
)

// Columns holds all SQL columns for user fields.
var Columns = []string{
	FieldID,
	FieldName,
	FieldEmail,
	FieldLogin,
	FieldPassword,
	FieldRole,
	FieldLastLogin,
	FieldIsActive,
	FieldNotionID,
	FieldIsNotionSubject,
}

var (
	// CollectionsPrimaryKey and CollectionsColumn2 are the table columns denoting the
	// primary key for the collections relation (M2M).
	CollectionsPrimaryKey = []string{"user_id", "collection_id"}
	// ObjectInfoPrimaryKey and ObjectInfoColumn2 are the table columns denoting the
	// primary key for the object_info relation (M2M).
	ObjectInfoPrimaryKey = []string{"user_id", "object_id"}
)

// ValidColumn reports if the column name is valid (part of the table columns).
func ValidColumn(column string) bool {
	for i := range Columns {
		if column == Columns[i] {
			return true
		}
	}
	return false
}

var (
	// DefaultIsActive holds the default value on creation for the "is_active" field.
	DefaultIsActive bool
	// DefaultIsNotionSubject holds the default value on creation for the "is_notion_subject" field.
	DefaultIsNotionSubject bool
	// DefaultID holds the default value on creation for the "id" field.
	DefaultID func() puuid.ID
)
