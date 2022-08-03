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
	"radioatelier/package/structs"
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
		lastSync = db.GetLastSync(ctx)
	}

	err := syncNextChunk(nil)
	if err != nil {
		fmt.Println(err.Error())
	}
}

func syncNextChunk(startCursor *string) error {
	res, err := external.QueryNotionObjects(ctx, lastSync, startCursor)
	if err != nil {
		return err
	}

	for _, notionPage := range res.Results {
		page := structs.NewPageFromNotion(notionPage)
		// retrieving an object from the DB
		obj, err := getOrCreateObject(page, currentSyncTime)
		if err != nil {
			fmt.Println(err.Error())
			continue
		}

		if obj.LastSync == &currentSyncTime {
			// the object was just created, we only need to update the notion lastSync time
			_, err = external.UpdateLastSync(ctx, *obj.NotionID, currentSyncTime)
			if err != nil {
				fmt.Println(err.Error())
			}
			continue
		}

		if obj.UpdatedAt.After(page.UpdatedAt) {
			// object in the database was updated after the one in notion, no need to update it with notion data
			continue
		}

		// update the object
		updateObject(obj, page)

		// update lastSync in notion
		_, err = external.UpdateLastSync(ctx, *obj.NotionID, currentSyncTime)
		if err != nil {
			fmt.Println(err.Error())
		}
	}

	if res.HasMore {
		return syncNextChunk((*string)(&res.NextCursor))
	}

	return nil
}

func getOrCreateObject(page structs.Page, currentSyncTime time.Time) (*ent.Object, error) {
	// retrieving an object from the DB
	obj, err := db.Client.Object.Query().
		Where(object.NotionIDEQ(page.NotionID)).
		First(ctx)
	if err != nil {
		fmt.Println(err.Error())
		// let's assume that it means that the object doesn't exist

		if page.DeletedAt != nil {
			// object is not present in the database and already deleted in Notion, no need to add it in the first place
			return nil, errors.New("object is not present in the database and already deleted in Notion, skipping")
		}

		// dealing with user
		usr, err := getOrCreateUser(page.CreatedBy)
		if err != nil {
			return nil, err
		}

		// dealing with city
		city, err := getOrCreateCity(page.City, page.Country)
		if err != nil {
			return nil, err
		}

		// creating an object in the DB
		return db.Client.Object.Create().
			SetName(page.Name).
			SetNillableInstalledPeriod(page.InstalledPeriod).
			SetIsRemoved(page.IsRemoved).
			SetNillableRemovedPeriod(page.RemovedPeriod).
			SetSource(page.Source).
			SetType(page.Type).
			SetTags(page.Tags).
			SetCreatedAt(page.CreatedAt).
			SetUpdatedAt(page.UpdatedAt).
			SetLastSync(currentSyncTime).
			SetCreatedBy(usr).
			SetUpdatedBy(usr).
			SetNotionID(page.NotionID).
			SetCity(city).
			Save(ctx)
	}

	return obj, err
}

func updateObject(obj *ent.Object, page structs.Page) {
	obj.Name = page.Name
	obj.InstalledPeriod = page.InstalledPeriod
	obj.IsRemoved = page.IsRemoved
	obj.RemovedPeriod = page.RemovedPeriod
	obj.Source = &page.Source
	obj.Type = page.Type
	obj.Tags = page.Tags
	obj.UpdatedAt = page.UpdatedAt
	obj.LastSync = &currentSyncTime

	if page.DeletedAt != nil {
		obj.DeletedAt = page.DeletedAt
	}

	updatedBy, err := getOrCreateUser(page.UpdatedBy)
	if err == nil {
		obj.Edges.UpdatedBy = updatedBy

		if page.DeletedAt != nil {
			obj.Edges.DeletedBy = updatedBy
		}
	}

	city, err := getOrCreateCity(page.City, page.Country)
	if err == nil {
		obj.Edges.City = city
	}

	obj.Update()
}

func getOrCreateUser(userID string) (*ent.User, error) {
	usr, err := db.Client.User.Query().
		Where(user.NotionIDEQ(userID)).
		First(ctx)
	if err != nil {
		fmt.Println(err.Error())

		// let's assume for now that the user doesn't exist

		//retrieving a user from notion
		notionUser, err := external.NotionClient.User.Get(ctx, notionapi.UserID(userID))
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
