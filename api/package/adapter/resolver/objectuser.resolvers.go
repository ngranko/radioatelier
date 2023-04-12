package resolver

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
    "context"
    "fmt"
    "time"

    "radioatelier/ent/schema/puuid"
)

// SetVisit is the resolver for the setVisit field.
func (r *mutationResolver) SetVisit(ctx context.Context, objectID puuid.ID, userID puuid.ID, visitedDate *time.Time) (*time.Time, error) {
    panic(fmt.Errorf("not implemented"))
}

// GetVisit is the resolver for the getVisit field.
func (r *queryResolver) GetVisit(ctx context.Context, objectID puuid.ID, userID puuid.ID) (*time.Time, error) {
    panic(fmt.Errorf("not implemented"))
}
