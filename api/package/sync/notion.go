package sync

import (
	"context"
	"errors"
	"fmt"
	"radioatelier/ent"
	"radioatelier/ent/city"
	"radioatelier/ent/object"
	"radioatelier/ent/user"
	"radioatelier/package/db"
	"radioatelier/package/external"
	"radioatelier/package/types/property"
	"strings"
	"time"

	"github.com/jomei/notionapi"
)

var ctx = context.TODO()
var currentSyncTime = time.Now()
var lastSync *time.Time = nil

func SyncFromNotion() {
	currentSyncTime = time.Now()

	if lastSync == nil {
		getDBLastSyncTime()
	}

	err := doSync(nil)
	if err != nil {
		fmt.Println(err.Error())
	}
}

func getDBLastSyncTime() {
	obj, err := db.Client.Object.Query().
		Unique(true).
		Select(object.FieldLastSync).
		Order(ent.Desc(object.FieldLastSync)).
		First(ctx)
	if err == nil {
		lastSync = obj.LastSync
	}
}

func doSync(startCursor *string) error {
	res, err := external.QueryNotionObjects(ctx, lastSync, startCursor)
	if err != nil {
		return err
	}

	for _, page := range res.Results {
		// retrieving an object from the DB
		obj, err := getOrCreateObject(page, currentSyncTime)
		if err != nil {
			// TODO: change it to continue later
			fmt.Println(err.Error())
			return err
		}

		if obj.LastSync == &currentSyncTime {
			// the object was just created, we only need to update the notion lastSync time
			// TODO: update the notion last sync field and change return to continue later on
			return nil
		}

		// update the object
	}

	if res.HasMore {
		return doSync((*string)(&res.NextCursor))
	}

	return nil
}

func getOrCreateObject(page notionapi.Page, currentSyncTime time.Time) (*ent.Object, error) {
	// retrieving an object from the DB
	obj, err := db.Client.Object.Query().
		Where(object.NotionIDEQ(page.ID.String())).
		First(ctx)
	if err != nil {
		fmt.Println(err.Error())
		// let's assume that it means that the object doesn't exist

		if page.Archived {
			// object is not present in the database and already deleted in Notion, no need to add it in the first place
			return nil, errors.New("object is not present in the database and already deleted in Notion, skipping")
		}

		// dealing with user
		usr, err := getOrCreateUser(page.CreatedBy.ID)
		if err != nil {
			return nil, err
		}

		// dealing with city
		city, err := getOrCreateCity(
			property.NewSelectProperty(page.Properties["Город"]).GetValue(),
			property.NewSelectProperty(page.Properties["Страна"]).GetValue(),
		)
		if err != nil {
			return nil, err
		}

		// creating an object in the DB
		return db.Client.Object.Create().
			SetName(property.NewTitleProperty(page.Properties["Название"]).GetValue()).
			SetNillableInstalledPeriod(property.NewRichTextProperty(page.Properties["Установлена"]).GetNillableValue()).
			SetIsRemoved(property.NewCheckboxProperty(page.Properties["Демонтирована?"]).GetValue()).
			SetNillableRemovedPeriod(property.NewRichTextProperty(page.Properties["Период демонтажа"]).GetNillableValue()).
			SetSource(property.NewURLProperty(page.Properties["Источник"]).GetValue()).
			SetType(property.NewSelectProperty(page.Properties["Тип"]).GetValue()).
			SetTags(property.NewMultiSelectProperty(page.Properties["Теги"]).GetValue()).
			SetCreatedAt(page.CreatedTime).
			SetUpdatedAt(page.LastEditedTime).
			SetLastSync(currentSyncTime).
			SetCreatedBy(usr).
			SetUpdatedBy(usr).
			SetNotionID(page.ID.String()).
			SetCity(city).
			Save(ctx)
	}

	return obj, err
}

func getOrCreateUser(userID notionapi.UserID) (*ent.User, error) {
	usr, err := db.Client.User.Query().
		Where(user.NotionIDEQ(userID.String())).
		First(ctx)
	if err != nil {
		fmt.Println(err.Error())

		// let's assume for now that the user doesn't exist

		//retrieving a user from notion
		notionUser, err := external.NotionClient.User.Get(ctx, userID)
		if err != nil {
			return nil, err
		}

		// retrieving user email from notion if it's available
		newUserEmail := ""
		if notionUser.Type == "person" {
			newUserEmail = notionUser.Person.Email
		}

		// creating a user in the database
		return db.Client.User.Create().
			SetName(notionUser.Name).
			SetLogin(strings.ToLower(strings.ReplaceAll(notionUser.Name, " ", ""))).
			SetPassword("").
			SetRole("external").
			SetIsActive(false).
			SetEmail(newUserEmail).
			SetNotionID(notionUser.ID.String()).
			Save(ctx)
	}
	return usr, err
}

func getOrCreateCity(cityName string, countryName string) (*ent.City, error) {
	// searching for a city in the DB
	city, err := db.Client.City.Query().
		Where(city.NameEQ(cityName)).
		First(ctx)
	if err != nil {
		fmt.Println(err.Error())

		// let's assume that it doesn't exsists for now
		return db.Client.City.Create().
			SetName(cityName).
			SetCountry(countryName).
			Save(ctx)
	}
	return city, err
}
