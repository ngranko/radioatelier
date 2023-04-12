package schedule

import (
    "context"

    "radioatelier/package/adapter/cron"
    "radioatelier/package/sync"
)

func init() {
    c := cron.New()
    c.AddJob("@hourly", syncFromNotion)
    c.Start()
}

func syncFromNotion() {
    sync.FromNotion(context.Background())
}
