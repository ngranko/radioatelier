import {query} from './_generated/server';
import {resolveImageThumbnailUrl} from './helpers/imageStorage';
import {findCoverImageId} from './helpers/objectImages';
import {loadObjectAggregates} from './helpers/objectReader';
import {getCurrentUserOrThrow} from './users';

export const list = query({
    args: {},
    handler: async ctx => {
        const user = await getCurrentUserOrThrow(ctx);
        const objects = await ctx.db
            .query('objects')
            .withIndex('byCreatedByIdAndIsPendingReview', q =>
                q.eq('createdById', user._id).eq('isPendingReview', true),
            )
            .order('desc')
            .collect();
        const aggregates = await loadObjectAggregates(ctx, objects);
        const items = objects.map(async object => {
            const aggregate = aggregates.get(object._id);
            if (!aggregate) {
                return null;
            }
            const coverId = await findCoverImageId(ctx, object._id);
            return {
                id: object._id,
                name: object.name,
                category: {id: aggregate.category._id, name: aggregate.category.name},
                tags: aggregate.tags.map(tag => ({id: tag._id, name: tag.name})),
                imageUrl: coverId ? await resolveImageThumbnailUrl(ctx, coverId) : null,
                latitude: aggregate.mapPoint.latitude,
                longitude: aggregate.mapPoint.longitude,
            };
        });
        return (await Promise.all(items)).filter(item => item !== null);
    },
});
