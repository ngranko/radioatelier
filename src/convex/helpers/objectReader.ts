import type {Doc, Id, TableNames} from '../_generated/dataModel';
import type {MutationCtx, QueryCtx} from '../_generated/server';

export type ObjectAggregate = {
    object: Doc<'objects'>;
    mapPoint: Doc<'mapPoints'>;
    category: Doc<'categories'>;
    tags: Doc<'tags'>[];
};

type ReaderCtx = Pick<QueryCtx, 'db'> | Pick<MutationCtx, 'db'>;

export async function loadObjectAggregate(
    ctx: ReaderCtx,
    object: Doc<'objects'>,
): Promise<ObjectAggregate | null> {
    const aggregates = await loadObjectAggregates(ctx, [object]);
    return aggregates.get(object._id) ?? null;
}

// A missing map point or category invalidates the aggregate (the Object is
// unusable without them); missing tag docs are silently omitted so a deleted
// tag doesn't orphan the Objects that referenced it.
export async function loadObjectAggregates(
    ctx: ReaderCtx,
    objects: Doc<'objects'>[],
): Promise<Map<Id<'objects'>, ObjectAggregate>> {
    const [mapPoints, categories, tags] = await Promise.all([
        loadDocs(
            ctx,
            'mapPoints',
            objects.map(object => object.mapPointId),
        ),
        loadDocs(
            ctx,
            'categories',
            objects.map(object => object.categoryId),
        ),
        loadDocs(
            ctx,
            'tags',
            objects.flatMap(object => object.tagIds),
        ),
    ]);

    const aggregates = new Map<Id<'objects'>, ObjectAggregate>();
    for (const object of objects) {
        const mapPoint = mapPoints.get(object.mapPointId);
        const category = categories.get(object.categoryId);
        if (!mapPoint || !category) {
            continue;
        }
        aggregates.set(object._id, {
            object,
            mapPoint,
            category,
            tags: object.tagIds
                .map(tagId => tags.get(tagId))
                .filter((tag): tag is Doc<'tags'> => tag !== undefined),
        });
    }
    return aggregates;
}

async function loadDocs<TableName extends TableNames>(
    ctx: ReaderCtx,
    table: TableName,
    ids: Id<TableName>[],
): Promise<Map<Id<TableName>, Doc<TableName>>> {
    const docs = new Map<Id<TableName>, Doc<TableName>>();
    await Promise.all(
        [...new Set(ids)].map(async docId => {
            const doc = await ctx.db.get(table, docId);
            if (doc) {
                docs.set(docId, doc);
            }
        }),
    );
    return docs;
}
