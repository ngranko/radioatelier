package list

import (
    "gorm.io/gorm"

    "radioatelier/package/adapter/db/model"
    "radioatelier/package/infrastructure/db"
)

var Migration202511041755 = Migration{
    Version: "202511041755",
    Apply: func(client *db.Client) error {
        err := client.Exec("CREATE FUNCTION ulid_bin() RETURNS BINARY(16)\nNOT DETERMINISTIC NO SQL SQL SECURITY INVOKER\nRETURN CONCAT(\n  UNHEX(LPAD(HEX(CAST(UNIX_TIMESTAMP(CURRENT_TIMESTAMP(3)) * 1000 AS UNSIGNED)), 12, '0')),\n  RANDOM_BYTES(10)\n);").Error
        if err != nil {
            return err
        }

        err = client.Exec("insert into images (id, created_at, link) select ulid_bin() as id, now() as created_at, image as link from objects where image is not null and image != ''").Error
        if err != nil {
            return err
        }

        err = client.Exec("update objects o join images i on o.image = i.link set o.cover_id = i.id").Error
        if err != nil {
            return err
        }

        return client.Exec("alter table objects drop column image").Error
    },
    Rollback: func(client *db.Client) error {
        return client.Session(&gorm.Session{AllowGlobalUpdate: true}).Delete(&model.Image{}).Error
    },
}
