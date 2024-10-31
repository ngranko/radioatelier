package list

import (
    "radioatelier/package/infrastructure/db"
)

var Migration202410310401 = Migration{
    Version: "202410310401",
    Apply: func(client *db.Client) error {
        err := client.Exec("ALTER TABLE map_points ADD INDEX coordinates (latitude,longitude)").Error
        if err != nil {
            return err
        }
        err = client.Exec("ALTER TABLE objects ADD INDEX is_public (is_public)").Error
        if err != nil {
            return err
        }
        return nil
    },
    Rollback: func(client *db.Client) error {
        err := client.Exec("ALTER TABLE map_points DROP INDEX coordinates").Error
        if err != nil {
            return err
        }
        err = client.Exec("ALTER TABLE objects DROP INDEX is_public").Error
        if err != nil {
            return err
        }
        return nil
    },
}
