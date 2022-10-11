package sync

import (
	"context"
	"errors"
	"fmt"
	"radioatelier/ent"
	"radioatelier/ent/city"
	"radioatelier/ent/object"
	"radioatelier/ent/user"
	c "radioatelier/package/constants"
	"radioatelier/package/db"
	"radioatelier/package/external"
	"radioatelier/package/structs"
	"strings"
	"time"

	"github.com/jomei/notionapi"
)

func syncNextChunk(ctx context.Context, startCursor *string) error {
	res, err := external.QueryNotionObjects(ctx, startCursor)
	if err != nil {
		return err
	}

	for _, notionPage := range res.Results {
		syncPage(ctx, notionPage)
	}

	if res.HasMore {
		return syncNextChunk(ctx, (*string)(&res.NextCursor))
	}

	return nil
}

func syncPage(ctx context.Context, notionPage notionapi.Page) {
	page := structs.NewPageFromNotion(notionPage)

	obj, err := getObject(ctx, page)
	if err != nil {
		obj, err = createObject(ctx, page)
		if err != nil {
			fmt.Println(err.Error())
			return
		}
	} else {
		if obj.UpdatedAt.After(page.UpdatedAt) {
			fmt.Println("Record in the database updated after the one in notion")
			return
		}

		updateObject(ctx, obj, page)
	}

	upsertObjectUser(ctx, obj, page)
	updateNotionLastSync(ctx, obj)
}

func getObject(ctx context.Context, page structs.Page) (*ent.Object, error) {
	return db.Client.Object.Query().
		Where(object.NotionIDEQ(page.NotionID)).
		First(ctx)
}

func createObject(ctx context.Context, page structs.Page) (*ent.Object, error) {
	if page.DeletedAt != nil {
		return nil, errors.New("object is not present in the database and already deleted in Notion, skipping")
	}

	usr, err := getOrCreateUser(ctx, page.CreatedBy)
	if err != nil {
		return nil, err
	}

	city, err := getOrCreateCity(ctx, page.City, page.Country)
	if err != nil {
		return nil, err
	}

	return doCreateObject(ctx, page, usr, city)
}

func doCreateObject(ctx context.Context, page structs.Page, usr *ent.User, city *ent.City) (*ent.Object, error) {
	currentTime := time.Now()

	return db.Client.Object.Create().
		SetName(page.Name).
		SetNillableInstalledPeriod(page.InstalledPeriod).
		SetIsRemoved(page.IsRemoved).
		SetNillableRemovedPeriod(page.RemovedPeriod).
		SetSource(page.Source).
		SetType(page.Type).
		SetTags(page.Tags).
		SetCreatedAt(page.CreatedAt).
		SetUpdatedAt(currentTime).
		SetLastSync(currentTime).
		SetCreatedBy(usr).
		SetUpdatedBy(usr).
		SetNotionID(page.NotionID).
		SetCity(city).
		Save(ctx)
}

func updateObject(ctx context.Context, obj *ent.Object, page structs.Page) (*ent.Object, error) {
	currentTime := time.Now()

	query := obj.Update().
		SetName(page.Name).
		SetNillableInstalledPeriod(page.InstalledPeriod).
		SetIsRemoved(page.IsRemoved).
		SetNillableRemovedPeriod(page.RemovedPeriod).
		SetSource(page.Source).
		SetType(page.Type).
		SetTags(page.Tags).
		SetUpdatedAt(page.UpdatedAt).
		SetLastSync(currentTime).
		SetUpdatedAt(currentTime)

	if page.DeletedAt != nil {
		query = query.SetNillableDeletedAt(page.DeletedAt)
	}

	updatedBy, err := getOrCreateUser(ctx, page.UpdatedBy)
	if err == nil {
		query = query.SetUpdatedBy(updatedBy)

		if page.DeletedAt != nil {
			query = query.SetDeletedBy(updatedBy)
		}
	}

	city, err := getOrCreateCity(ctx, page.City, page.Country)
	if err == nil {
		query = query.SetCity(city)
	}

	return query.Save(ctx)
}

func upsertObjectUser(ctx context.Context, obj *ent.Object, page structs.Page) {
	err := db.Client.ObjectUser.Create().
		SetObjectID(obj.ID).
		SetUserID(ctx.Value(c.SubjectUser).(*ent.User).ID).
		SetIsVisited(page.IsVisited).
		SetNillableLastVisit(page.LastVisited).
		OnConflict().
		UpdateNewValues().
		Exec(ctx)
	if err != nil {
		fmt.Println(err.Error())
	}
}

func updateNotionLastSync(ctx context.Context, obj *ent.Object) {
	_, err := external.UpdateLastSync(ctx, *obj.NotionID, *obj.LastSync)
	if err != nil {
		fmt.Println(err.Error())
	}
}

func getOrCreateUser(ctx context.Context, userID string) (*ent.User, error) {
	usr, err := db.Client.User.Query().
		Where(user.NotionIDEQ(userID)).
		First(ctx)
	if err != nil {
		fmt.Println(err.Error())

		// let's assume for now that the user doesn't exist

		notionUser, err := external.NotionClient.User.Get(ctx, notionapi.UserID(userID))
		if err != nil {
			return nil, err
		}

		newUserEmail := ""
		if notionUser.Type == "person" {
			newUserEmail = notionUser.Person.Email
		}

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

func getOrCreateCity(ctx context.Context, cityName string, countryName string) (*ent.City, error) {
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
