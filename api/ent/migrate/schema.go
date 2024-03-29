// Code generated by ent, DO NOT EDIT.

package migrate

import (
	"entgo.io/ent/dialect/sql/schema"
	"entgo.io/ent/schema/field"
)

var (
	// CitiesColumns holds the columns for the "cities" table.
	CitiesColumns = []*schema.Column{
		{Name: "id", Type: field.TypeString, SchemaType: map[string]string{"mysql": "char(39)"}},
		{Name: "name", Type: field.TypeString, SchemaType: map[string]string{"mysql": "varchar(50)"}},
		{Name: "country", Type: field.TypeString, SchemaType: map[string]string{"mysql": "varchar(50)"}},
	}
	// CitiesTable holds the schema information for the "cities" table.
	CitiesTable = &schema.Table{
		Name:       "cities",
		Columns:    CitiesColumns,
		PrimaryKey: []*schema.Column{CitiesColumns[0]},
	}
	// CollectionsColumns holds the columns for the "collections" table.
	CollectionsColumns = []*schema.Column{
		{Name: "id", Type: field.TypeString, SchemaType: map[string]string{"mysql": "char(39)"}},
		{Name: "name", Type: field.TypeString, SchemaType: map[string]string{"mysql": "varchar(100)"}},
		{Name: "description", Type: field.TypeString, Nullable: true, SchemaType: map[string]string{"mysql": "varchar(255)"}},
		{Name: "created_at", Type: field.TypeTime},
		{Name: "updated_at", Type: field.TypeTime},
		{Name: "created_by", Type: field.TypeString, SchemaType: map[string]string{"mysql": "char(39)"}},
		{Name: "updated_by", Type: field.TypeString, SchemaType: map[string]string{"mysql": "char(39)"}},
	}
	// CollectionsTable holds the schema information for the "collections" table.
	CollectionsTable = &schema.Table{
		Name:       "collections",
		Columns:    CollectionsColumns,
		PrimaryKey: []*schema.Column{CollectionsColumns[0]},
		ForeignKeys: []*schema.ForeignKey{
			{
				Symbol:     "collections_users_created_collections",
				Columns:    []*schema.Column{CollectionsColumns[5]},
				RefColumns: []*schema.Column{UsersColumns[0]},
				OnDelete:   schema.NoAction,
			},
			{
				Symbol:     "collections_users_updated_collections",
				Columns:    []*schema.Column{CollectionsColumns[6]},
				RefColumns: []*schema.Column{UsersColumns[0]},
				OnDelete:   schema.NoAction,
			},
		},
	}
	// ObjectsColumns holds the columns for the "objects" table.
	ObjectsColumns = []*schema.Column{
		{Name: "id", Type: field.TypeString, SchemaType: map[string]string{"mysql": "char(39)"}},
		{Name: "name", Type: field.TypeString},
		{Name: "address", Type: field.TypeString, Nullable: true},
		{Name: "description", Type: field.TypeString, Nullable: true},
		{Name: "lat", Type: field.TypeFloat64, Nullable: true, SchemaType: map[string]string{"mysql": "decimal(9,6)"}},
		{Name: "lng", Type: field.TypeFloat64, Nullable: true, SchemaType: map[string]string{"mysql": "decimal(9,6)"}},
		{Name: "installed_period", Type: field.TypeString, Nullable: true, SchemaType: map[string]string{"mysql": "varchar(20)"}},
		{Name: "is_removed", Type: field.TypeBool, Default: false},
		{Name: "removed_period", Type: field.TypeString, Nullable: true, SchemaType: map[string]string{"mysql": "varchar(20)"}},
		{Name: "source", Type: field.TypeString, Nullable: true},
		{Name: "type", Type: field.TypeString, SchemaType: map[string]string{"mysql": "varchar(24)"}},
		{Name: "tags", Type: field.TypeString, SchemaType: map[string]string{"mysql": "varchar(100)"}},
		{Name: "created_at", Type: field.TypeTime},
		{Name: "updated_at", Type: field.TypeTime},
		{Name: "deleted_at", Type: field.TypeTime, Nullable: true},
		{Name: "last_sync", Type: field.TypeTime, Nullable: true},
		{Name: "notion_id", Type: field.TypeString, Nullable: true, SchemaType: map[string]string{"mysql": "char(36) binary"}},
		{Name: "city_id", Type: field.TypeString, SchemaType: map[string]string{"mysql": "char(39)"}},
		{Name: "created_by", Type: field.TypeString, SchemaType: map[string]string{"mysql": "char(39)"}},
		{Name: "updated_by", Type: field.TypeString, SchemaType: map[string]string{"mysql": "char(39)"}},
		{Name: "deleted_by", Type: field.TypeString, Nullable: true, SchemaType: map[string]string{"mysql": "char(39)"}},
	}
	// ObjectsTable holds the schema information for the "objects" table.
	ObjectsTable = &schema.Table{
		Name:       "objects",
		Columns:    ObjectsColumns,
		PrimaryKey: []*schema.Column{ObjectsColumns[0]},
		ForeignKeys: []*schema.ForeignKey{
			{
				Symbol:     "objects_cities_objects",
				Columns:    []*schema.Column{ObjectsColumns[17]},
				RefColumns: []*schema.Column{CitiesColumns[0]},
				OnDelete:   schema.NoAction,
			},
			{
				Symbol:     "objects_users_created_objects",
				Columns:    []*schema.Column{ObjectsColumns[18]},
				RefColumns: []*schema.Column{UsersColumns[0]},
				OnDelete:   schema.NoAction,
			},
			{
				Symbol:     "objects_users_updated_objects",
				Columns:    []*schema.Column{ObjectsColumns[19]},
				RefColumns: []*schema.Column{UsersColumns[0]},
				OnDelete:   schema.NoAction,
			},
			{
				Symbol:     "objects_users_deleted_objects",
				Columns:    []*schema.Column{ObjectsColumns[20]},
				RefColumns: []*schema.Column{UsersColumns[0]},
				OnDelete:   schema.SetNull,
			},
		},
	}
	// ObjectUsersColumns holds the columns for the "object_users" table.
	ObjectUsersColumns = []*schema.Column{
		{Name: "is_visited", Type: field.TypeBool, Default: false},
		{Name: "last_visit", Type: field.TypeTime, Nullable: true, SchemaType: map[string]string{"mysql": "date"}},
		{Name: "user_id", Type: field.TypeString, SchemaType: map[string]string{"mysql": "char(39)"}},
		{Name: "object_id", Type: field.TypeString, SchemaType: map[string]string{"mysql": "char(39)"}},
	}
	// ObjectUsersTable holds the schema information for the "object_users" table.
	ObjectUsersTable = &schema.Table{
		Name:       "object_users",
		Columns:    ObjectUsersColumns,
		PrimaryKey: []*schema.Column{ObjectUsersColumns[2], ObjectUsersColumns[3]},
		ForeignKeys: []*schema.ForeignKey{
			{
				Symbol:     "object_users_users_user",
				Columns:    []*schema.Column{ObjectUsersColumns[2]},
				RefColumns: []*schema.Column{UsersColumns[0]},
				OnDelete:   schema.NoAction,
			},
			{
				Symbol:     "object_users_objects_object",
				Columns:    []*schema.Column{ObjectUsersColumns[3]},
				RefColumns: []*schema.Column{ObjectsColumns[0]},
				OnDelete:   schema.NoAction,
			},
		},
	}
	// UsersColumns holds the columns for the "users" table.
	UsersColumns = []*schema.Column{
		{Name: "id", Type: field.TypeString, SchemaType: map[string]string{"mysql": "char(39)"}},
		{Name: "name", Type: field.TypeString, SchemaType: map[string]string{"mysql": "varchar(50)"}},
		{Name: "email", Type: field.TypeString, Unique: true, SchemaType: map[string]string{"mysql": "varchar(50)"}},
		{Name: "login", Type: field.TypeString, Unique: true, SchemaType: map[string]string{"mysql": "varchar(24)"}},
		{Name: "password", Type: field.TypeString, SchemaType: map[string]string{"mysql": "char(60)"}},
		{Name: "role", Type: field.TypeString, SchemaType: map[string]string{"mysql": "varchar(10)"}},
		{Name: "last_login", Type: field.TypeTime, Nullable: true},
		{Name: "is_active", Type: field.TypeBool, Default: true},
		{Name: "notion_id", Type: field.TypeString, Nullable: true, SchemaType: map[string]string{"mysql": "char(36) binary"}},
		{Name: "is_notion_subject", Type: field.TypeBool, Default: false},
	}
	// UsersTable holds the schema information for the "users" table.
	UsersTable = &schema.Table{
		Name:       "users",
		Columns:    UsersColumns,
		PrimaryKey: []*schema.Column{UsersColumns[0]},
	}
	// ObjectCollectionsColumns holds the columns for the "object_collections" table.
	ObjectCollectionsColumns = []*schema.Column{
		{Name: "object_id", Type: field.TypeString},
		{Name: "collection_id", Type: field.TypeString},
	}
	// ObjectCollectionsTable holds the schema information for the "object_collections" table.
	ObjectCollectionsTable = &schema.Table{
		Name:       "object_collections",
		Columns:    ObjectCollectionsColumns,
		PrimaryKey: []*schema.Column{ObjectCollectionsColumns[0], ObjectCollectionsColumns[1]},
		ForeignKeys: []*schema.ForeignKey{
			{
				Symbol:     "object_collections_object_id",
				Columns:    []*schema.Column{ObjectCollectionsColumns[0]},
				RefColumns: []*schema.Column{ObjectsColumns[0]},
				OnDelete:   schema.Cascade,
			},
			{
				Symbol:     "object_collections_collection_id",
				Columns:    []*schema.Column{ObjectCollectionsColumns[1]},
				RefColumns: []*schema.Column{CollectionsColumns[0]},
				OnDelete:   schema.Cascade,
			},
		},
	}
	// UserCollectionsColumns holds the columns for the "user_collections" table.
	UserCollectionsColumns = []*schema.Column{
		{Name: "user_id", Type: field.TypeString},
		{Name: "collection_id", Type: field.TypeString},
	}
	// UserCollectionsTable holds the schema information for the "user_collections" table.
	UserCollectionsTable = &schema.Table{
		Name:       "user_collections",
		Columns:    UserCollectionsColumns,
		PrimaryKey: []*schema.Column{UserCollectionsColumns[0], UserCollectionsColumns[1]},
		ForeignKeys: []*schema.ForeignKey{
			{
				Symbol:     "user_collections_user_id",
				Columns:    []*schema.Column{UserCollectionsColumns[0]},
				RefColumns: []*schema.Column{UsersColumns[0]},
				OnDelete:   schema.Cascade,
			},
			{
				Symbol:     "user_collections_collection_id",
				Columns:    []*schema.Column{UserCollectionsColumns[1]},
				RefColumns: []*schema.Column{CollectionsColumns[0]},
				OnDelete:   schema.Cascade,
			},
		},
	}
	// Tables holds all the tables in the schema.
	Tables = []*schema.Table{
		CitiesTable,
		CollectionsTable,
		ObjectsTable,
		ObjectUsersTable,
		UsersTable,
		ObjectCollectionsTable,
		UserCollectionsTable,
	}
)

func init() {
	CollectionsTable.ForeignKeys[0].RefTable = UsersTable
	CollectionsTable.ForeignKeys[1].RefTable = UsersTable
	ObjectsTable.ForeignKeys[0].RefTable = CitiesTable
	ObjectsTable.ForeignKeys[1].RefTable = UsersTable
	ObjectsTable.ForeignKeys[2].RefTable = UsersTable
	ObjectsTable.ForeignKeys[3].RefTable = UsersTable
	ObjectUsersTable.ForeignKeys[0].RefTable = UsersTable
	ObjectUsersTable.ForeignKeys[1].RefTable = ObjectsTable
	ObjectCollectionsTable.ForeignKeys[0].RefTable = ObjectsTable
	ObjectCollectionsTable.ForeignKeys[1].RefTable = CollectionsTable
	UserCollectionsTable.ForeignKeys[0].RefTable = UsersTable
	UserCollectionsTable.ForeignKeys[1].RefTable = CollectionsTable
}
