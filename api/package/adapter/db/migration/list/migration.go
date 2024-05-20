package list

import (
    "radioatelier/package/infrastructure/db"
)

type Migration struct {
    Version  string
    Apply    func(client *db.Client) error
    Rollback func(client *db.Client) error
}
