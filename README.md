# Radioatelier. Archive

A map-based archive of signs, plaques, mosaics, and other urban artifacts. Users add photos and metadata, search the archive or Google Places, share object links, and track personal tags and visits.

## Run locally

Use Node.js 26 or newer and Bun 1.4 or newer, as required by [package.json](package.json).

1. Install dependencies with `bun install`.
2. Copy `.env.local.example` to `.env.local` and fill in the app configuration.
3. Configure the Convex development deployment separately. Follow [Environment](docs/environment.md) for Clerk, Google, and Typesense setup. Notion is optional unless sync is enabled for a user.
4. Run `bun run dev`. This starts Convex and Vite together. Vite listens on port 5173 and requires that port to be available.

## Commands

| Command              | Purpose                                                                |
| -------------------- | ---------------------------------------------------------------------- |
| `bun run dev`        | Run Convex and Vite in development                                     |
| `bun run check`      | Generate SvelteKit types and run `svelte-check`                        |
| `bun run test`       | Run Vitest once                                                        |
| `bun run test:watch` | Run Vitest in watch mode                                               |
| `bun run lint`       | Apply Oxlint fixes, ESLint fixes to Svelte files, and Oxfmt formatting |
| `bun run format`     | Format the repository with Oxfmt                                       |
| `bun run deploy`     | Deploy Convex with the configured frontend build command               |
| `bun run start`      | Serve the generated Node application                                   |
| `bun run preview`    | Preview existing Vite build output                                     |

## Find your way around

| Directory               | Responsibility                                                    |
| ----------------------- | ----------------------------------------------------------------- |
| `src/routes/`           | Pages, server loaders, form actions, and route layouts            |
| `src/lib/components/`   | Svelte UI components                                              |
| `src/lib/state/`        | Shared reactive client state                                      |
| `src/lib/services/map/` | Map provider, marker lifecycle, renderers, and interactions       |
| `src/convex/`           | Schema, queries, mutations, actions, webhooks, and scheduled jobs |
| `scripts/typesense/`    | Search collection setup and index reconciliation                  |
| `docker/app/`           | Development and production container stages                       |

## Documentation

Start with [Context](CONTEXT.md) for domain terms.

### Setup and operations

- [Environment](docs/environment.md): local and Convex variables, service setup.
- [Database maintenance](docs/maintenance.md): migrations, scheduled cleanup, and repair paths.
- [Testing](docs/testing.md): checks, test discovery, and manual verification.
- [Search](docs/search.md): search behavior, Typesense setup, and backfill runbook.
- [Notion sync](docs/notion-sync.md): user mapping, webhooks, sync rules, and audit.
- [Analytics](docs/analytics.md): PostHog proxy, identity, feature flag, and events.

### Application behavior and architecture

- [Authentication and access](docs/authentication.md): sign-in and recovery, route gates, shared links, and permissions.
- [Object backend](docs/object-backend.md): data model, reads, writes, and personal state.
- [Images and cover photos](docs/images.md): resizing, cropping, storage ownership, and retention.
- [Browser state](docs/browser-state.md): app shell, theme, location, URL state, and persistence.
- [Map architecture](docs/map-architecture.md): marker feeds, renderers, focus, and gestures.
- [Object details overlay](docs/object-details-overlay.md): view, edit, preview, and create flows.
- [Category settings](docs/category-settings.md): personal styles and the taxonomy picker.
- [Street View](docs/street-view.md): panorama lookup, caching, and minimap.
- [CSV import](docs/import.md): accepted fields, batches, progress, and failure handling.
