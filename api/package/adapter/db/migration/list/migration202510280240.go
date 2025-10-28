package list

import (
    "strconv"

    "radioatelier/package/infrastructure/db"
)

var Migration202510280240 = Migration{
    Version: "202510280240",
    Apply: func(client *db.Client) error {
        err := client.Exec("create trigger objects_set_code\n" +
            "before insert on objects\n" +
            "for each row\n" +
            "begin\n" +
            "  insert into sequences values (null);\n" +
            "  set @n := last_insert_id();\n" +
            "  set NEW.internal_id = concat('RA-', @n);\n" +
            "end").Error
        if err != nil {
            return err
        }

        result := client.Exec("UPDATE objects o\n" +
            "JOIN (\n" +
            "    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) AS rn\n" +
            "FROM objects\n" +
            "WHERE internal_id IS NULL\n" +
            ") f ON f.id = o.id\n" +
            "SET o.internal_id = CONCAT('RA-', f.rn);")
        if result.Error != nil {
            return result.Error
        }

        err = client.Exec("ALTER TABLE sequences AUTO_INCREMENT = " + strconv.Itoa(int(result.RowsAffected+1))).Error
        if err != nil {
            return err
        }

        return nil
    },
    Rollback: func(client *db.Client) error {
        err := client.Exec("drop trigger if exists objects_set_code").Error
        if err != nil {
            return err
        }
        return nil
    },
}
