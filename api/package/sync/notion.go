package sync

import (
	"context"
	"fmt"
	"radioatelier/ent"
	"radioatelier/ent/user"
	c "radioatelier/package/constants"
	"radioatelier/package/db"
	"time"
)

func FromNotion() {
	ctx := withSubjectUser(context.Background())

	err := syncNextChunk(ctx, nil)
	if err != nil {
		fmt.Println(err.Error())
	}
}

func ToNotion(obj *ent.Object) {
	currentTime := time.Now()
	ctx := withSubjectUser(context.Background())
	obj.LastSync = &currentTime

	if obj.NotionID == nil {
		err := createInNotion(ctx, obj)
		if err != nil {
			fmt.Println(err.Error())
			return
		}
	} else if obj.DeletedAt != nil {
		err := deleteInNotion(ctx, obj)
		if err != nil {
			fmt.Println(err.Error())
			return
		}
	} else {
		err := updateInNotion(ctx, obj)
		if err != nil {
			fmt.Println(err.Error())
			return
		}
	}

	updateLastSync(ctx, obj)
}

func withSubjectUser(ctx context.Context) context.Context {
	subjectUser, _ := db.Client.User.Query().
		Where(user.IsNotionSubjectEQ(true)).
		First(ctx)
	return context.WithValue(ctx, c.SubjectUser, subjectUser)
}
