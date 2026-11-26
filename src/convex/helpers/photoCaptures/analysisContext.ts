import type {Doc} from '../../_generated/dataModel';
import type {QueryCtx} from '../../_generated/server';
import type {AnalysisContext} from './analysisPrompt';

const EXAMPLE_TITLE_COUNT = 30;

export async function loadAnalysisContext(
    ctx: QueryCtx,
    capture: Doc<'photoCaptures'>,
): Promise<AnalysisContext> {
    const [categories, tags, recentObjects] = await Promise.all([
        ctx.db.query('categories').collect(),
        ctx.db.query('tags').collect(),
        // Public titles only: private ones belong to their owners and shouldn't leave the archive.
        ctx.db
            .query('objects')
            .withIndex('byIsPublic', q => q.eq('isPublic', true))
            .order('desc')
            .take(EXAMPLE_TITLE_COUNT),
    ]);
    return {
        categories: categories
            .filter(category => !category.isDeleting)
            .map(category => ({id: category._id, name: category.name})),
        tags: tags.filter(tag => !tag.isDeleting).map(tag => ({id: tag._id, name: tag.name})),
        exampleTitles: recentObjects.map(object => object.name),
        address:
            [capture.address, capture.city, capture.country].filter(Boolean).join(', ') || null,
    };
}
