# Environment

App configuration and backend secrets live in separate environments. Copy [.env.local.example](../.env.local.example) for local development. Code under `src/convex/` reads variables from its Convex deployment, not from the app's `.env.local`.

## Setup order

1. Install dependencies and configure the development Convex project.
2. Fill in `.env.local` for SvelteKit, Clerk, browser Maps, and PostHog.
3. Configure authentication and server Google APIs on the Convex development deployment.
4. Create the Typesense collection and install its scoped keys on Convex. See [Search setup](search.md#typesense-setup).
5. Configure [Notion sync](notion-sync.md) if users will have sync enabled.
6. Run `bun run dev` to start Vite and Convex together.

Set deployment variables through the Convex dashboard or CLI:

```bash
npx convex env set VARIABLE_NAME 'value'
```

Use `--prod` when deliberately configuring production. Development and production need their own values.

## Local app and scripts

| Variable                       | Consumer                                                            |
| ------------------------------ | ------------------------------------------------------------------- |
| `CONVEX_DEPLOYMENT`            | Convex CLI deployment selection                                     |
| `PUBLIC_CONVEX_URL`            | Browser and server Convex clients; default URL for backfill scripts |
| `PUBLIC_CONVEX_SITE_URL`       | Reference host for webhook URLs; app code does not read it          |
| `PUBLIC_CLERK_PUBLISHABLE_KEY` | Browser Clerk integration                                           |
| `CLERK_SECRET_KEY`             | SvelteKit Clerk server integration                                  |
| `PUBLIC_GOOGLE_MAPS_API_KEY`   | Browser Google Maps, Street View, and initial-location fallback     |
| `PUBLIC_GOOGLE_MAPS_MAP_ID`    | Google map styling and vector map configuration                     |
| `PUBLIC_POSTHOG_PROJECT_TOKEN` | Browser and SvelteKit server PostHog clients                        |
| `PUBLIC_POSTHOG_HOST`          | Server PostHog API host and browser `ui_host`                       |
| `GIT_COMMIT_SHA`               | Optional build-time release identifier; defaults to `local`         |
| `TYPESENSE_URL`                | Local setup and backfill scripts                                    |
| `TYPESENSE_ADMIN_KEY`          | Local setup and backfill administration                             |
| `TYPESENSE_COLLECTION`         | Local script collection name; defaults to `objects`                 |
| `TYPESENSE_BACKFILL_KEY`       | Backfill credential, matching the target Convex deployment          |

`PUBLIC_` variables are browser-visible. Values imported from `$env/static/public` are compiled into the app. Supply them to the automated build environment as well as local development.

`src/lib/config/index.ts` rejects blank browser Maps keys or Map IDs. Live position tracking uses `navigator.geolocation`. When there is no saved viewport or position, initial centering also calls Google's Geolocation API with the browser key; see [Browser state](browser-state.md#initial-location-and-live-tracking).

## Convex deployment

### Authentication

| Variable                  | Consumer                                                  |
| ------------------------- | --------------------------------------------------------- |
| `CLERK_JWT_ISSUER_DOMAIN` | `src/convex/auth.config.ts`, with application ID `convex` |
| `CLERK_WEBHOOK_SECRET`    | Svix verification at `POST /clerk-users-webhook`          |

Configure a Clerk JWT template named `convex`. The server client requests that template and the browser auth bridge uses it for Convex authentication. The issuer must match the Clerk application.

Point Clerk user webhooks at `https://<deployment>.convex.site/clerk-users-webhook` and enable `user.created`, `user.updated`, and `user.deleted`. These events populate the app user records required by most authenticated backend functions. See [Authentication](authentication.md).

### Google server APIs

`GOOGLE_API_KEY` is used by Convex geocoding and Google Places search. Configure it separately from the browser key. The browser key serves Maps JavaScript, Street View, and initial geolocation; the server key serves Geocoding and Places.

### Typesense

| Variable                 | Consumer                                        |
| ------------------------ | ----------------------------------------------- |
| `TYPESENSE_URL`          | Runtime Typesense clients                       |
| `TYPESENSE_SYNC_KEY`     | Scheduled index writes                          |
| `TYPESENSE_SEARCH_KEY`   | Search actions                                  |
| `TYPESENSE_COLLECTION`   | Optional collection name, default `objects`     |
| `TYPESENSE_BACKFILL_KEY` | Temporary access to `typesense:getBackfillPage` |

Convex does not use `TYPESENSE_ADMIN_KEY`. Keep that key with local maintenance configuration. The backfill endpoint exports all objects, including private objects, and rejects requests while its secret is unset. See the [backfill runbook](search.md#running-the-backfill-against-production).

### Notion

| Variable                                | Purpose                                     |
| --------------------------------------- | ------------------------------------------- |
| `NOTION_API_KEY`                        | Notion integration token                    |
| `NOTION_DATA_SOURCE_ID`                 | Target data source ID                       |
| `NOTION_WEBHOOK_VERIFICATION_TOKEN`     | Verify signatures at `POST /notion-webhook` |
| `NOTION_SYNC_APP_URL`                   | App origin used to construct object links   |
| `NOTION_SYNC_FALLBACK_USER_EXTERNAL_ID` | Clerk ID of the fallback sync owner         |

The fallback user must exist in Convex, be active, and have sync enabled. Property mapping, metadata, and webhook setup are in [Notion sync](notion-sync.md).

## Deployment configuration

The app uses the Node adapter. `docker/app/Dockerfile` has development, build, and production stages; the production stage serves the generated app on port 3000. The Docker build accepts `GIT_COMMIT_SHA` or falls back to `RAILWAY_GIT_COMMIT_SHA` for the release identifier.

The package deploy script runs Convex deployment with an automated frontend build command. Builds are handled automatically; do not invoke the build command directly. See [Analytics](analytics.md) for release tagging and the fixed EU ingest proxy.
