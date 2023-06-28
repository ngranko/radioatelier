package sync

import (
    "context"
    "errors"
    "fmt"
    "strings"
    "time"

    "radioatelier/ent"
    "radioatelier/ent/city"
    "radioatelier/ent/object"
    "radioatelier/ent/user"
    "radioatelier/package/external"
    "radioatelier/package/infrastructure/db"
    "radioatelier/package/infrastructure/notion"
    "radioatelier/package/structs"

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
        // currently in Notion CreatedAt and UpdatedAt are getting truncated to a minute,
        // but that can change in the future, so let's truncate both values
        if obj.UpdatedAt.Truncate(time.Minute).After(page.UpdatedAt.Truncate(time.Minute)) {
            fmt.Println("Record in the database updated after the one in notion")
            return
        }

        obj, err = updateObject(ctx, obj, page)
        if err != nil {
            fmt.Println(err.Error())
            return
        }
    }

    updateNotionLastSync(ctx, obj)
}

func getObject(ctx context.Context, page structs.Page) (*ent.Object, error) {
    return db.GetClient().Object.Query().
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

    ct, err := getOrCreateCity(ctx, page.City, page.Country)
    if err != nil {
        return nil, err
    }

    return doCreateObject(ctx, page, usr, ct)
}

func doCreateObject(ctx context.Context, page structs.Page, usr *ent.User, city *ent.City) (*ent.Object, error) {
    currentTime := time.Now()

    return db.GetClient().Object.Create().
        SetName(page.Name).
        SetNillableAddress(page.Address).
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
        SetNillableAddress(page.Address).
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
        // deleting pages doesn't seem to work at the moment because Notion doesn't send the archived pages through its API
        query = query.SetNillableDeletedAt(page.DeletedAt)
    }

    updatedBy, err := getOrCreateUser(ctx, page.UpdatedBy)
    if err == nil {
        query = query.SetUpdatedBy(updatedBy)

        if page.DeletedAt != nil {
            query = query.SetDeletedBy(updatedBy)
        }
    }

    ct, err := getOrCreateCity(ctx, page.City, page.Country)
    if err == nil {
        query = query.SetCity(ct)
    }

    return query.Save(ctx)
}

func updateNotionLastSync(ctx context.Context, obj *ent.Object) {
    _, err := external.UpdateLastSync(ctx, *obj.NotionID, *obj.LastSync)
    if err != nil {
        fmt.Println(err.Error())
    }
}

func getOrCreateUser(ctx context.Context, userID string) (*ent.User, error) {
    usr, err := db.GetClient().User.Query().
        Where(user.NotionIDEQ(userID)).
        First(ctx)
    if err != nil {
        fmt.Println(err.Error())

        // let's assume for now that the user doesn't exist

        notionUser, err := notion.GetClient().User.Get(ctx, notionapi.UserID(userID))
        if err != nil {
            return nil, err
        }

        newUserEmail := ""
        if notionUser.Type == "person" {
            newUserEmail = notionUser.Person.Email
        }

        return db.GetClient().User.Create().
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
    ct, err := db.GetClient().City.Query().
        Where(city.NameEQ(cityName)).
        First(ctx)
    if err != nil {
        fmt.Println(err.Error())

        // let's assume that it doesn't exsists for now

        return db.GetClient().City.Create().
            SetName(cityName).
            SetCountry(countryName).
            Save(ctx)
    }
    return ct, err
}
