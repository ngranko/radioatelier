package cron

import (
    robfigCron "github.com/robfig/cron/v3"
)

type Cron struct {
    cron *robfigCron.Cron
}

type JobID = robfigCron.EntryID

func New() *Cron {
    return &Cron{
        cron: robfigCron.New(),
    }
}

func (c Cron) AddJob(schedule string, job func()) (JobID, error) {
    return c.cron.AddFunc(schedule, job)
}

func (c Cron) Start() {
    c.cron.Start()
}
