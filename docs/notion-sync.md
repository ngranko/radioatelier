# Notion sync

Selected users sync archive objects with a configured Notion data source. App mutations schedule outbound actions; signed Notion webhooks drive inbound changes. `objectNotionSync` stores the page link, field hash, timestamps, and latest error.

## Configure users and webhooks

Set the five `NOTION_*` deployment variables listed in [Environment](environment.md#notion). Use the data source ID expected by `notion/config.ts`, and give the integration access to that data source.

In Clerk public metadata, set `notionSyncEnabled: true` for participating users and `notionUserId` to map a Notion user. Clerk webhooks copy those values into Convex. The fallback Clerk user must also exist, be active, and have sync enabled.

For inbound creation, identity resolution uses the page's `created_by.id`, falling back to `last_edited_by.id` when absent. An eligible mapped app user wins; otherwise the configured fallback user owns the new object.

To configure the webhook:

1. Subscribe at `https://<deployment>.convex.site/notion-webhook`.
2. Read the initial `verification_token` from the Convex logs.
3. Set it as `NOTION_WEBHOOK_VERIFICATION_TOKEN` and enter the same token in Notion's verification dialog.
4. Enable `page.created`, `page.properties_updated`, `page.deleted`, and `page.undeleted`.

`src/convex/http.ts` verifies `x-notion-signature` before dispatching supported events. Ordinary page retrievals must belong to the configured data source. Delete events use the existing sync link directly.

## Synced fields

The mapping lives in `src/convex/notion/fields.ts`.

| App sync field    | Notion property  | Direction                             |
| ----------------- | ---------------- | ------------------------------------- |
| `name`            | Название         | Both                                  |
| `categoryName`    | Тип              | Both                                  |
| `address`         | Адрес            | Both                                  |
| `city`            | Город            | Both                                  |
| `country`         | Страна           | Both                                  |
| `installedPeriod` | Период установки | Both                                  |
| `isRemoved`       | Демонтирован     | Both                                  |
| `removalPeriod`   | Период демонтажа | Both                                  |
| `tagNames`        | Теги             | Both                                  |
| `isVisited`       | Посещен          | Both, using the owner's visited state |
| `source`          | Источник         | Both                                  |
| `mapLink`         | Ссылка на архив  | App to Notion only                    |
| `internalId`      | Внутренний ID    | App to Notion only                    |

Coordinates, description, cover images, public visibility, and private tags are outside this vocabulary. Inbound creation geocodes the address fields; ordinary inbound patches do not move coordinates.

Outbound property conversion uses the data source's property schema. Missing schemas and unsupported writable types cause errors; read-only property types are skipped. Configure the property names above rather than assuming a database with different names will work.

## Outbound flow

Owner create and update mutations schedule `notionSync/outbound.enqueueOutboundObjectSync` when sync is enabled. Owner removal archives a linked page. CSV import schedules one lenient batch per successful import batch, logging individual failures and continuing.

Personal edits by non-owners do not schedule outbound sync. Repositioning updates coordinates and search indexing without scheduling Notion sync.

Snapshots load core data through `objectReader.ts` and batch sync records and owner-visited state through `snapshotExtras.ts`. Outbound reconciliation uses the stored page link first, then an object URL match, then heuristic matching. Heuristics require a matching name and at least one shared category/address field, with no disagreement among shared comparison fields. Ambiguous matches are not guessed.

Notion API requests retry rate limits and transient server failures. Sync state records errors from outbound failures.

## Inbound flow

```text
notion-webhook
  -> notionSync/inbound.processWebhookEvent
  -> retrieve page and load sync context
  -> inboundDecision.decideInboundSync
  -> objectsSync mutation or sync-state update
```

| Decision        | Behavior                                                                |
| --------------- | ----------------------------------------------------------------------- |
| `skip`          | Ignore an inapplicable event or missing context                         |
| `createObject`  | For an unlinked `page.created`, resolve owner, geocode, and create      |
| `patchObject`   | Apply a linked page's field diff through the object writer adapter      |
| `recordEcho`    | Update sync metadata when the field hash matches the last outbound hash |
| `deleteObject`  | Delete an object linked to a removed page                               |
| `rejectInbound` | Record an error where linked, then throw for an empty name or category  |

An unlinked update or undelete event does not create an object. Creation also skips when no eligible owner or geocoded location is available.

`objectsSync.ts` calls `notionSync/objectWriterAdapter.ts` to resolve taxonomy and prepare writer payloads. It shares object persistence and Typesense scheduling with interactive writes; see [Object backend](object-backend.md).

## Field and echo rules

- Empty nullable fields clear the corresponding app values. Empty required names and categories reject the inbound change.
- `mapLink` and `internalId` are outbound-only, so changes to them do not patch app fields.
- `computeSyncHash` serializes fields in the fixed order in `reconcile.ts`. Tag names are normalized, deduplicated, and sorted.
- A matching `lastOutboundHash` suppresses object writes and refreshes sync metadata only when needed.

## Audit discrepancies

Run `notionSync/discrepancyReport:reportDiscrepancies` for a read-only comparison. It returns `summary` and `discrepancies` and logs each issue. `summary.inSync` is true when the report finds no discrepancies; the action does not repair them.

| Kind                    | Meaning                                        |
| ----------------------- | ---------------------------------------------- |
| `ambiguous_match`       | Multiple heuristic matches                     |
| `unmatched_app_object`  | Eligible object without a matched page         |
| `unmatched_notion_page` | Page without a matched object                  |
| `missing_notion_page`   | Resolved page absent from the snapshot         |
| `link_mismatch`         | Stored link differs from the resolved match    |
| `field_mismatch`        | Sync fields differ; inspect `differingFields`  |
| `missing_sync_record`   | Matched pair has no sync-state row             |
| `stale_outbound_hash`   | Stored hash differs from current object fields |

## Verify sync

Use a sync-enabled test owner and verify both services after each operation:

1. Create, edit, and remove an app object; confirm page creation, updates, and archival.
2. Create a valid Notion page with a resolvable address; confirm object ownership and coordinates.
3. Edit a linked page, including clearing a nullable field; confirm the app changes.
4. Empty a required name or category; confirm rejection and recorded error.
5. Delete a linked page; confirm the object is removed.
6. Run the audit and inspect any discrepancies.

Helper tests cover matching, hashing, snapshots, inbound decisions, and outbound actions. They mock APIs rather than running against Notion or a Convex deployment; see [Testing](testing.md).
