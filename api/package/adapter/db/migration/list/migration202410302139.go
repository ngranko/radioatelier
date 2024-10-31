package list

import (
    "radioatelier/package/infrastructure/db"
)

var Migration202410302139 = Migration{
    Version: "202410302139",
    Apply: func(client *db.Client) error {
        err := client.Exec("ALTER TABLE objects ADD FULLTEXT INDEX name (name)").Error
        if err != nil {
            return err
        }
        err = client.Exec("ALTER TABLE map_points ADD FULLTEXT INDEX address_city_country (address,city,country)").Error
        if err != nil {
            return err
        }
        return nil
    },
    Rollback: func(client *db.Client) error {
        err := client.Exec("ALTER TABLE objects DROP INDEX name").Error
        if err != nil {
            return err
        }
        err = client.Exec("ALTER TABLE map_points DROP INDEX address_city_country").Error
        if err != nil {
            return err
        }
        return nil
    },
}
