package list

import (
    "gorm.io/gorm"

    "radioatelier/package/adapter/db/model"
    "radioatelier/package/adapter/password"
    "radioatelier/package/infrastructure/db"
)

var Migration202405230126 = Migration{
    Version: "202405230126",
    Apply: func(client *db.Client) error {
        pass, err := password.NewFromRaw("123456").Hash()
        if err != nil {
            return err
        }

        return client.Create(&model.User{
            Name:     "admin",
            Email:    "admin@radioatelier.one",
            Password: pass,
            Role:     "admin",
            IsActive: true,
        }).Error
    },
    Rollback: func(client *db.Client) error {
        return client.Session(&gorm.Session{AllowGlobalUpdate: true}).Delete(&model.User{}).Error
    },
}
