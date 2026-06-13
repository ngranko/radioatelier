# Context

Domain vocabulary for Radioatelier. Use these terms consistently in code, comments, and ADRs.

## Core concepts

-   **Object** — an archive entry (a sign, plaque, mosaic). The unit users create, view, and share. Stored in `objects` with related `mapPoints`, `markers`, `objectPrivateTags`, and tag references.
-   **Marker** — the map-rendered representation of an Object. One marker per object. Carries category and tag IDs for styling.
-   **Map point** — the geographic coordinates and address of an Object (`mapPoints`).
-   **Tag** — global, public label on Objects.
-   **Private tag** — per-user label on an Object, scoped to the user who created it.
-   **Object writer** — `src/convex/helpers/objectWriter.ts`. The single module that writes Object records (`objects`, `mapPoints`, `markers`) plus the per-user verbs for private tags. Speaks resolved category/tag **IDs**; verbs are `create`, `replace` (full-field), `patch` (present-fields-only, including coordinates). Form mutations, Sync-flavoured mutations, and the import adapter (`importBatch` in `src/convex/imports.ts`, which routes through `createObjectRecords` and `upsertPrivateTags`) are the three adapters at its seam. Auth, classification (name→ID resolution), Typesense scheduling, and sync bookkeeping stay in the callers.

## Notion sync

-   **Notion adapter** — `src/convex/notion/`. The low-level integration with Notion's API: client, field reading/writing, webhook signature verification, matching, types. Knows Notion's wire format. Speaks `NotionPageFields`.
-   **Object Sync Fields** (`AppSyncFields` in code) — the projection of an Object in the sync vocabulary. The field set that flows in and out of any sync target. Includes `mapLink` (the URL pointing back to the app Object).
-   **Sync state record** — `objectNotionSync` table. One row per synced Object: link to the Notion page, last outbound hash, last inbound edited time, last sync error. The durability layer of sync.
-   **Sync identity** — maps a Notion workspace user id (from the page’s `created_by` / `last_edited_by`) to a sync-enabled Convex user, falling back to the configured sync user when needed.
-   **Outbound sync** — app → Notion. Triggered when a sync-enabled user creates/updates/deletes an Object.
-   **Inbound sync** — Notion → app. Triggered by Notion webhook events.
-   **Sync audit** — `reportDiscrepancies` action. Read-only pass over app Objects and Notion pages that reports link, field, and sync-state mismatches without writing either side.
-   **Sync-flavoured mutations** — `createObjectFromSync`, `patchObjectFromSync`, `deleteObjectFromSync` in `src/convex/objects.ts`. The Object writers used by inbound sync, distinct from the auth-checking form-driven `create`, `update`, `remove`.
