# Environment variables

The project uses two configuration surfaces:

| Surface | Purpose |
| ------- | ------- |
| **`.env.local`** | SvelteKit dev/build, Convex CLI linkage, and local maintenance scripts. |
| **Convex deployment** | Everything executed inside `src/convex/` (actions, mutations, HTTP routes, cron). |

`bun run dev` runs Vite and `convex dev` together. Convex functions read **only** deployment env vars (`process.env` in `src/convex/`), not SvelteKit’s `.env.local`, unless you have also set the same names on the Convex deployment.

Set Convex variables for each deployment (dev, prod) via the [dashboard](https://dashboard.convex.dev) or:

```bash
npx convex env set VARIABLE_NAME "value"
```

List current values:

```bash
npx convex env list
```

## `.env.local` (local app)

See `.env.local.example`.

| Variable | Used by |
| -------- | ------- |
| `CONVEX_DEPLOYMENT` | Convex CLI (`convex dev`, `convex deploy`) |
| `PUBLIC_CONVEX_URL` | SvelteKit client, server Convex HTTP client, Typesense backfill script |
| `PUBLIC_CONVEX_SITE_URL` | Operational reference for webhook URLs (`https://….convex.site/...`); not read in code |
| `PUBLIC_CLERK_PUBLISHABLE_KEY` | `svelte-clerk` in the browser |
| `CLERK_SECRET_KEY` | `svelte-clerk` on the SvelteKit server |
| `TYPESENSE_URL` | Local Typesense setup/backfill scripts |
| `TYPESENSE_ADMIN_KEY` | Local Typesense setup/backfill scripts (admin scope) |
| `TYPESENSE_COLLECTION` | Local scripts; optional on Convex (defaults to `objects`) |
| `TYPESENSE_BACKFILL_KEY` | Backfill script; **must match** the Convex variable of the same name |
| `PUBLIC_GOOGLE_MAPS_API_KEY` | Map UI, Street View, browser geolocation (`$lib/config`) |
| `PUBLIC_GOOGLE_MAPS_MAP_ID` | Google Maps map style / vector map id |

**Google keys:** the `PUBLIC_GOOGLE_*` pair is for the browser (Maps JavaScript API, referrer-restricted). `GOOGLE_API_KEY` on Convex is a separate server key for Geocoding and Places — see below.

## Convex deployment (backend)

### Authentication (Clerk ↔ Convex)

| Variable | Used by |
| -------- | ------- |
| `CLERK_JWT_ISSUER_DOMAIN` | `src/convex/auth.config.ts` — Clerk JWT issuer URL (e.g. `https://your-app.clerk.accounts.dev`) |
| `CLERK_WEBHOOK_SECRET` | `src/convex/http.ts` — verifies `POST /clerk-users-webhook` |

Configure the Clerk JWT template named `convex` and add the Convex issuer URL in the Clerk dashboard as described in [Convex + Clerk](https://docs.convex.dev/auth/clerk).

### Google (server)

| Variable | Used by |
| -------- | ------- |
| `GOOGLE_API_KEY` | Geocoding (`helpers/geocode.ts`, `locations.ts`), Google Places search (`search/googlePlaces.ts`) |

Restrict this key to server APIs (Geocoding, Places) in Google Cloud. Use `PUBLIC_GOOGLE_MAPS_API_KEY` for the map UI, not this variable.

### Typesense (runtime sync + search)

| Variable | Used by |
| -------- | ------- |
| `TYPESENSE_URL` | `src/convex/typesense/client.ts` |
| `TYPESENSE_SYNC_KEY` | Index writes from Convex |
| `TYPESENSE_SEARCH_KEY` | Search actions (read-only key) |
| `TYPESENSE_COLLECTION` | Optional; defaults to `objects` |
| `TYPESENSE_BACKFILL_KEY` | `typesense:getBackfillPage` action; must match local backfill script |

`TYPESENSE_ADMIN_KEY` is **not** used by Convex — only local setup/backfill scripts.

### Notion sync

| Variable | Used by |
| -------- | ------- |
| `NOTION_API_KEY` | Notion API client |
| `NOTION_DATA_SOURCE_ID` | Target database / data source |
| `NOTION_WEBHOOK_VERIFICATION_TOKEN` | `POST /notion-webhook` signature verification |
| `NOTION_SYNC_APP_URL` | Builds `/object/[id]` map links in outbound sync |
| `NOTION_SYNC_FALLBACK_USER_EXTERNAL_ID` | Clerk user id for pages without a mapped Notion owner |
| `NOTION_BACKFILL_KEY` | `notionSync/backfill:backfillInternalIdPage` action; must match local backfill script |

Webhook URL: `https://<deployment>.convex.site/notion-webhook` (use `PUBLIC_CONVEX_SITE_URL` from `.env.local` as the host prefix).

Further Notion setup: [notion-sync.md](./notion-sync.md).

## Quick setup checklist

**Local (`.env.local`):**

1. Copy `.env.local.example` → `.env.local`.
2. Fill Convex/Clerk public URLs, Clerk secret, and `PUBLIC_GOOGLE_MAPS_*` for the frontend.
3. Add Typesense admin URL/key if you run setup/backfill scripts.

**Convex (dev deployment):**

1. `CLERK_JWT_ISSUER_DOMAIN`, `CLERK_WEBHOOK_SECRET`
2. `GOOGLE_API_KEY`
3. `TYPESENSE_URL`, `TYPESENSE_SYNC_KEY`, `TYPESENSE_SEARCH_KEY`, `TYPESENSE_BACKFILL_KEY` (and optionally `TYPESENSE_COLLECTION`)
4. All `NOTION_*` variables if sync is enabled (including `NOTION_BACKFILL_KEY` when running the internal_id backfill)

Repeat the Convex step for production with production credentials.
