# Context

Domain vocabulary for Radioatelier. Use these terms consistently in code, comments, and ADRs.

## Core concepts

- **Object** — an archive entry (a sign, plaque, mosaic). The unit users create, view, and share. Stored in `objects` with related `mapPoints`, `markers`, `objectPrivateTags`, and tag references.
- **Marker** — the map-rendered representation of an Object. One marker per object. Carries category and tag IDs for styling.
- **Marker focus** — `src/lib/services/map/markerFocus.ts`. The single owner of which marker is highlighted and centered on the map. Markers register under the id the details overlay would show for them; one effect in `map.svelte` bridges the overlay's `detailsId` into it. No other module touches marker highlight state.
- **Map point** — the geographic coordinates and address of an Object (`mapPoints`).
- **Tag** — global, public label on Objects.
- **Private tag** — per-user label on an Object, scoped to the user who created it.
- **Object aggregate** — an Object with its generic relations resolved: map point, category, tag docs. A missing map point or category invalidates the aggregate; deleted tags are omitted.
- **Object reader** — `src/convex/helpers/objectReader.ts`. The read-side mirror of the Object writer: the single module that joins an Object to its relations (single or batched, with deduped reads), producing Object aggregates. Projections sit on top of it — the client details DTO (`objectDetails.ts`), Object Sync Fields (`notionSync/snapshot.ts`), the search record (backfill and the writer), and the writer's `loadObjectTarget`. Viewer-relative extras (private tags, visited, cover) and sync extras (sync record, owner's visited) stay with their projections.
- **Object writer** — `src/convex/helpers/objectWriter.ts`. The single module that writes Object records (`objects`, `mapPoints`, `markers`) plus the per-user verbs for private tags. Speaks resolved category/tag **IDs**; verbs are `create`, `replace` (full-field), `patch` (present-fields-only, including coordinates). The writer owns the write's consequences: it derives the post-write search record itself and schedules Typesense indexing, skipping the schedule when a patch changes nothing. Field routing/diffing helpers live in `objectRecordPatch.ts`. Form mutations, Sync-flavoured mutations, and the import adapter (`importBatch` in `src/convex/imports.ts`, which routes through `createObjectRecords` and `upsertPrivateTags`) are the three adapters at its seam. Auth, classification (name→ID resolution), outbound sync scheduling, and sync bookkeeping stay in the callers.

## Notion sync

- **Notion adapter** — `src/convex/notion/`. The low-level integration with Notion's API: client, field reading/writing, webhook signature verification, matching, types. Knows Notion's wire format. Speaks `NotionPageFields`.
- **Object Sync Fields** (`AppSyncFields` in code) — the projection of an Object in the sync vocabulary. The field set that flows in and out of any sync target. Includes `mapLink` (the URL pointing back to the app Object) and `internalId` (the app-assigned `RA-{n}` identifier, outbound-only).
- **Sync state record** — `objectNotionSync` table. One row per synced Object: link to the Notion page, last outbound hash, last inbound edited time, last sync error. The durability layer of sync.
- **Sync identity** — maps a Notion workspace user id (from the page’s `created_by` / `last_edited_by`) to a sync-enabled Convex user, falling back to the configured sync user when needed.
- **Echo suppression** — how inbound sync avoids re-applying the app's own outbound writes. Outbound records `computeSyncHash` of the synced fields as `lastOutboundHash` on the Sync state record; inbound hashes the incoming Notion page fields and treats a match as an echo (sync-state bookkeeping only, no Object writes). The hash serializes fields in the canonical `syncFieldNames` order (`reconcile.ts`), so it is identical whether computed from Object Sync Fields or Notion page fields.
- **Outbound sync** — app → Notion. Triggered when a sync-enabled user creates/updates/deletes an Object.
- **Inbound sync** — Notion → app. Triggered by Notion webhook events.
- **Inbound apply patch** (`AppSyncApplyPatch` in code) — the null-free projection of a Notion→app diff that inbound sync actually applies. `null` in the sync vocabulary means "Notion has no value", and inbound keeps app fields rather than clearing them, so the inbound decision drops null-valued differences when building this patch — the single owner of keep-vs-clear. Raw diffs (nulls included) remain visible to the Sync audit.
- **Sync audit** — `reportDiscrepancies` action. Read-only pass over app Objects and Notion pages that reports link, field, and sync-state mismatches without writing either side.
- **Sync-flavoured mutations** — `createObjectFromSync`, `patchObjectFromSync`, `deleteObjectFromSync` in `src/convex/objects.ts`. The Object writers used by inbound sync, distinct from the auth-checking form-driven `create`, `update`, `remove`.
