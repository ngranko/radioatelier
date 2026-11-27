import {Migrations} from '@convex-dev/migrations';
import {components} from './_generated/api.js';
import type {DataModel} from './_generated/dataModel.js';

export const migrations = new Migrations<DataModel>(components.migrations);
export const run = migrations.runner();

// The schema requires isPendingReview, so these must complete on a deployment
// before it takes that schema.
export const backfillObjectPendingReview = migrations.define({
    table: 'objects',
    migrateOne: (ctx, object) => {
        if (object.isPendingReview === undefined) {
            return {isPendingReview: false};
        }
    },
});

export const backfillMarkerPendingReview = migrations.define({
    table: 'markers',
    migrateOne: (ctx, marker) => {
        if (marker.isPendingReview === undefined) {
            return {isPendingReview: false};
        }
    },
});

// The schema still accepts objects.coverId so this can run; drop the field
// from objectTableFields once it has completed on every deployment.
export const clearObjectCovers = migrations.define({
    table: 'objects',
    migrateOne: (_ctx, object) => (object.coverId === undefined ? undefined : {coverId: undefined}),
});
