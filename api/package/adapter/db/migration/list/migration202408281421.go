package list

import (
    "gorm.io/gorm"

    "radioatelier/package/adapter/db/model"
    "radioatelier/package/infrastructure/db"
)

var Migration202408281421 = Migration{
    Version: "202408281421",
    Apply: func(client *db.Client) error {
        objects := []model.Object{}
        err := client.Model(&model.Object{}).Find(&objects).Error
        if err != nil {
            return err
        }

        for _, object := range objects {
            mapPoint := model.MapPoint{
                Latitude:  object.Latitude,
                Longitude: object.Longitude,
                Address:   object.Address,
            }

            err = client.Create(&mapPoint).Error
            if err != nil {
                return err
            }

            object.MapPointID = mapPoint.ID
            err = client.Save(&object).Error
            if err != nil {
                return err
            }
        }

        return nil
    },
    Rollback: func(client *db.Client) error {
        client.Session(&gorm.Session{AllowGlobalUpdate: true}).Delete(&model.MapPoint{})
        return nil
    },
}
