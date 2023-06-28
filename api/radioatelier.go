package main

import (
    "context"
    "log"

    "radioatelier/ent"
    "radioatelier/ent/migrate"
    "radioatelier/package/infrastructure/db"
    "radioatelier/package/infrastructure/graphql"
    "radioatelier/package/infrastructure/router"
    "radioatelier/package/sync"
    //_ "radioatelier/package/schedule"
)

func main() {
    client := db.GetClient()
    // TODO: does this required if it should basically be available throughout the whole app lifecycle?
    defer client.Close()

    runMigrations(client)

    srv := graphql.NewServer(client)
    e := router.New(srv)

    //obj, _ := db.Client.Object.Create().SetName("test").SetType("Вывеска").SetTags("123").SetCityID("CT-7480cb00-2db8-4df0-8495-a550be8705fb").SetCreatedByID("UR-795242bf-096c-44d0").SetUpdatedByID("UR-795242bf-096c-44d0").Save(context.Background())
    //obj.Update().SetName("Updated test").Save(context.Background())
    //db.Client.Object.DeleteOne(obj).Exec(context.Background())

    sync.FromNotion(context.Background())

    e.Logger.Fatal(e.Start(":8080"))
}

func runMigrations(client *ent.Client) {
    // TODO: do I need to get a proper context over here?
    err := client.Schema.Create(
        context.Background(),
        migrate.WithDropIndex(true),
        migrate.WithDropColumn(true),
    )
    if err != nil {
        log.Fatalf("Error: failed creating schema resources %v\n", err)
    }
}
