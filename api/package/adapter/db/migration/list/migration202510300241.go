package list

import (
    "radioatelier/package/infrastructure/db"
)

var Migration202510300241 = Migration{
    Version: "202510300241",
    Apply: func(client *db.Client) error {
        client.Exec("ALTER TABLE object_users drop column rating")
        client.Exec("ALTER TABLE objects drop foreign key fk_objects_city")
        client.Exec("ALTER TABLE objects drop index fk_objects_city")
        client.Exec("ALTER TABLE objects drop column city_id")
        client.Exec("ALTER TABLE objects drop column address")
        client.Exec("ALTER TABLE objects drop column latitude")
        client.Exec("ALTER TABLE objects drop column longitude")
        client.Exec("ALTER TABLE objects drop column longitude")
        client.Exec("ALTER TABLE objects drop column tags")
        client.Exec("ALTER TABLE objects drop index fk_objects_updater")
        client.Exec("ALTER TABLE objects drop foreign key fk_objects_updater")
        client.Exec("ALTER TABLE objects drop column updated_by")
        client.Exec("drop table if exists cities")
        return nil
    },
    Rollback: func(client *db.Client) error {
        return nil
    },
}
