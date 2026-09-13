import {Migrations} from '@convex-dev/migrations';
import {randomMarkerColor, randomMarkerIconKey} from '../lib/services/map/markerStyling.data.js';
import {components} from './_generated/api.js';
import type {DataModel, Doc} from './_generated/dataModel.js';

export const migrations = new Migrations<DataModel>(components.migrations);
export const run = migrations.runner();

export const backfillMarkerStyling = migrations.define({
    table: 'categories',
    migrateOne: (ctx, item) => {
        const addedFields: Partial<Pick<Doc<'categories'>, 'markerColor' | 'markerIcon'>> = {};

        if (!item.markerColor) {
            addedFields.markerColor = randomMarkerColor();
        }
        if (!item.markerIcon) {
            addedFields.markerIcon = randomMarkerIconKey();
        }

        return addedFields;
    },
});

// Legacy images have no owner, so updatePreview's ownership check locks the
// Object's own author out of re-cropping its cover. An image referenced by
// Objects of several authors (or by none) has no single owner to inherit, so
// it is logged for manual assignment instead of guessed.
export const backfillImageOwners = migrations.define({
    table: 'images',
    migrateOne: async (ctx, image) => {
        if (image.createdById) {
            return;
        }

        const objects = await ctx.db
            .query('objects')
            .withIndex('byCoverId', q => q.eq('coverId', image._id))
            .collect();
        const ownerIds = [...new Set(objects.map(object => object.createdById))];
        if (ownerIds.length !== 1) {
            console.warn(
                `Image ${image._id} left without owner: ${ownerIds.length} candidates`,
                ownerIds,
            );
            return;
        }

        return {createdById: ownerIds[0]};
    },
});
