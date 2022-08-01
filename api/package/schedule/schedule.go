package schedule

import (
	"radioatelier/package/sync"

	"github.com/robfig/cron/v3"
)

func init() {
	c := cron.New()
	c.AddFunc("@hourly", sync.SyncFromNotion)
	c.Start()
}
