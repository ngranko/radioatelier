# Collection Access Control Plan

## Context

The current marker list is optimized around a compact `markers` table that stores one map-facing projection per object. This exists to avoid reading full object records for map rendering and should remain the canonical marker payload projection.

Future access control should move away from the public/private marker model toward user-based access:

- Owners have full access to their own objects.
- Users with access through collections or individual grants can edit user-specific fields.
- Shared object links remain read-only and outside the full marker list.

The access-control design should not make the hot marker query read twice as many rows by joining access rows to marker rows unless that cost is acceptable and measured.

## Principles

- Keep `markers` as the canonical compact marker projection.
- Do not duplicate marker payload per user by default.
- Avoid static database tables for concepts that can live as code-level scope kinds.
- Use access and membership tables only where they represent real product data.
- Add marker payload denormalization only if production IO measurements require it.
- Keep projection data rebuildable from canonical tables.

## Access Scope Model

Represent scope kinds in code, not in a `markerScopes` table:

```ts
type AccessScope =
    | {kind: 'owner'; userId: Id<'users'>}
    | {kind: 'collection'; collectionId: Id<'collections'>}
    | {kind: 'direct'; userId: Id<'users'>};
```

The backing data for these scopes should come from concrete product tables:

- Owner scope comes from `markers.createdById`.
- Collection scope comes from future collection and collection membership tables.
- Direct scope comes from future individual object grants.

No separate `userAccessibleScopes` table is needed while access is derivable from these product tables and there are no per-marker overrides.

## Marker Query Shape

The medium-term `markers.list` should combine multiple indexed sources:

1. Read owner markers directly from `markers` by owner.
2. Read accessible collection IDs for the user.
3. Read object IDs from collection membership chunks.
4. Read direct object grants for the user.
5. Fetch marker rows for collection/direct object IDs.
6. Dedupe by `objectId`.
7. Return the existing marker list shape, with ownership/editability derived separately.

This prepares for collection-based access control, but it is not expected to materially reduce marker IO by itself because marker rows still need to be read.

## Chunking Strategy

Do not chunk per user initially.

Preferred initial chunking:

- Owner markers: query `markers` directly by `createdById`.
- Collection markers: chunk collection membership by collection.
- Direct grants: query directly by `userId` unless users can receive thousands of direct grants.

Suggested collection membership chunk shape:

```ts
collectionMarkerChunks: {
    collectionId: Id<'collections'>;
    chunkNumber: number;
    objectIds: Id<'objects'>[];
}
```

Suggested indexes:

```ts
.index('byCollectionId', ['collectionId'])
.index('byCollectionIdAndChunkNumber', ['collectionId', 'chunkNumber'])
```

Start with a target chunk size around 250 object IDs:

```text
chunkCount = ceil(objectsInCollection / 250)
```

This keeps collection membership reads bounded without duplicating marker payload.

## IO Expectations

ID-only chunks help with access and membership limits, not marker row IO. A query that reads object IDs from chunks and then fetches marker rows still reads marker documents.

For actual marker IO reduction, the viable options are:

- Avoid unrelated invalidations, such as user activity timestamp writes.
- Avoid unnecessary `markers` patches when map/filter fields did not change.
- Query markers by viewport or region instead of loading the full accessible catalog.
- Denormalize marker payload into chunks if measurements justify the drift and maintenance cost.

Payload chunks could look like this later:

```ts
collectionMarkerPayloadChunks: {
    collectionId: Id<'collections'>;
    chunkNumber: number;
    markers: MarkerListItem[];
}
```

This should be treated as a later optimization layer, not the first access-control design.

## Permission Semantics

Keep detailed edit permissions out of the marker list where possible.

The marker list needs enough information to render and decide whether a marker is owner-draggable. Object details and edit screens should continue to resolve precise permissions through object-level queries.

Current and future modes:

- Owner: full edit access.
- Collection/direct access: user-specific field editing.
- Shared marker route: read-only.

## Migration Path

1. Keep the existing `markers` table as the canonical map projection.
2. Add collection tables and collection object membership.
3. Add collection membership chunks if collections can grow large.
4. Add direct grants only when individual object access is needed.
5. Update `markers.list` to merge owner, collection, and direct-grant sources.
6. Keep `isPublic` as a compatibility input only while the public model exists.
7. Remove public semantics once collection/direct access covers the required behavior.
8. Revisit payload chunks or viewport queries only after measuring production IO under the new model.

