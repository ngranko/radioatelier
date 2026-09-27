# Collection access proposal

Status: unimplemented design. The current schema has no collections, collection memberships, or direct object grants. Current permissions are documented in [Authentication](authentication.md); the current marker feed is documented in [Map architecture](map-architecture.md).

## Current behavior

`markers.list` combines the viewer's private markers with all public markers. `markers.listVisitedIds` supplies personal visited state separately. The `markers` table remains the compact projection used for rendering.

Owners can edit object fields. Other signed-in users can edit personal fields on public objects. Direct object links allow read-only access, including to private objects.

## Proposed permissions

Replace public discovery with access derived from ownership, collections, and optional individual grants:

| Source of access           | Intended permission                                    |
| -------------------------- | ------------------------------------------------------ |
| Owner                      | Full object editing                                    |
| Collection or direct grant | Personal fields such as visited state and private tags |
| Shared object link         | Read-only details, outside the full catalog            |

Derive scope kinds from actual ownership and membership records. A separate scope catalog or per-user accessible-scope table is unnecessary while those records can express access directly.

## Proposed marker query

1. Read the viewer's owned markers by owner index.
2. Resolve accessible collections and their object memberships.
3. Read direct grants, if supported.
4. Fetch marker rows for collection and grant object IDs.
5. Deduplicate by object ID and return the existing compact marker shape.

Object details should continue to resolve precise edit permissions. The marker list needs ownership for dragging, but does not need to duplicate the whole permission model.

## Membership and read costs

Start with collection membership records. If collection sizes require chunking, group object IDs by collection and chunk number, initially around 250 IDs per chunk. Index by collection and by collection plus chunk number. Direct grants can remain indexed by user unless their volume warrants a different representation.

ID chunks reduce membership reads; they do not eliminate reads of the marker rows themselves. Avoid copying marker payloads per user by default. Consider viewport queries or rebuildable marker-payload chunks only after measuring production read costs and update frequency.

The existing split between marker data and visited state already avoids some unrelated invalidations. Changed-field patching likewise avoids unnecessary marker writes.

## Migration outline

1. Add collections and object membership while retaining `markers` as the rendering projection.
2. Add membership chunks if measured collection sizes require them.
3. Add direct grants only if individual sharing is needed.
4. Update catalog and search filtering together, then object-level personal-edit permissions.
5. Retain `isPublic` during compatibility migration and remove it only after replacement access paths cover existing behavior.
6. Measure read costs before adding payload duplication.

This proposal does not define a rollout date, migration implementation, or final membership schema.
