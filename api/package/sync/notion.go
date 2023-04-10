package sync

import (
	"context"
	"fmt"
	"time"

	"radioatelier/ent"
)

func FromNotion(ctx context.Context) {
	err := syncNextChunk(ctx, nil)
	if err != nil {
		fmt.Println(err.Error())
	}
}

func ToNotion(ctx context.Context, obj *ent.Object) {
	currentTime := time.Now()
	obj.LastSync = &currentTime

	var err error = nil
	if obj.NotionID == nil {
		err = createInNotion(ctx, obj)
	} else if obj.DeletedAt != nil {
		err = deleteInNotion(ctx, obj)
	} else {
		err = updateInNotion(ctx, obj)
	}
	if err != nil {
		fmt.Println(err.Error())
		return
	}

	updateLastSync(ctx, obj)
}
