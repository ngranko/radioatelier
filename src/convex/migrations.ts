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
