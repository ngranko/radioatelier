# Database maintenance

Convex owns the application database, file storage, migration state, and scheduled jobs. Typesense is a separate derived index. These maintenance paths have different effects and must target the intended deployment.

## Available migrations

`src/convex/convex.config.ts` installs `@convex-dev/migrations`. Definitions and the generic `run` runner live in `src/convex/migrations.ts`.

| Function                | Table        | Effect                                                                                      |
| ----------------------- | ------------ | ------------------------------------------------------------------------------------------- |
| `backfillMarkerStyling` | `categories` | Fill missing color or icon values using the allowed random defaults; retain existing values |
| `backfillImageOwners`   | `images`     | Fill an absent uploader ID when all objects using the cover resolve to exactly one owner    |

The image-owner migration skips already attributed rows. Images with no referencing objects or with several distinct owners remain unchanged and log their candidate owners. Skipped rows need investigation; migration completion does not mean every image gained an owner.

## Run a migration

Use the installed migration runner from the repository root. These examples target the CLI's configured development deployment; add `--prod` only when intentionally operating on production.

Preview one batch without persisting its changes:

```bash
npx convex run migrations:run '{"fn":"migrations:backfillImageOwners","dryRun":true}'
```

Inspect its output, then start or resume the migration:

```bash
npx convex run migrations:run '{"fn":"migrations:backfillImageOwners"}'
```

Substitute `migrations:backfillMarkerStyling` for category styling. The component records progress and schedules batches. Repeating the runner reports or resumes its recorded state; it does not implicitly restart a completed migration. An explicit `reset: true` starts from the beginning. `batchSize` can override batch size.

A dry run checks a batch, not the whole table. Review completion status and logs in Convex after a real run, then verify the affected behavior, such as recropping a previously ownerless cover. The repository defines migrations but does not automatically run them from its deploy script.

## Scheduled cleanup

`src/convex/crons.ts` registers two daily internal mutations:

| Time, UTC | Function                 | Effect                                                                                 |
| --------- | ------------------------ | -------------------------------------------------------------------------------------- |
| 00:00     | `storage.cleanup`        | Remove image rows unused by covers, then storage files unreferenced by retained images |
| 00:15     | `imports.cleanupOldJobs` | Remove jobs older than seven days, using finish time or start time                     |

Storage cleanup has no grace period for fresh uploads. Import-job cleanup removes progress and feedback records, not imported objects. Both implementations collect their relevant tables rather than processing a paginated maintenance queue.

Object removal separately deletes its map point, marker, all personal tag associations, and visited references. It leaves shared category/tag definitions intact. External index removal and any Notion archival are scheduled separately from the database deletion.

## Repair derived data

- For missing or stale archive search results, use the [Typesense backfill](search.md#running-the-backfill-against-production). It reconciles documents and can delete stale index rows.
- For Notion mismatches, run the [sync audit](notion-sync.md#audit-discrepancies). It reports differences without repairing them.
- For image preview ownership failures, inspect image ownership and the migration results described above.

Neither external-service procedure runs automatically as part of the two daily cleanup jobs. A successful database mutation does not establish that its scheduled external action succeeded.
