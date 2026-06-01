# Environment & Setup

Complete reference for environment variables and third-party service configuration.

## Environment variables

Copy `.env.local.example` to `.env.local` for local development. Convex server-side variables are set in the Convex dashboard (or via `npx convex env set`).

### Frontend (SvelteKit / Vite)

| Variable | Required | Description |
| --- | --- | --- |
| `PUBLIC_CONVEX_URL` | Yes | Convex deployment URL (e.g. `https://your-deployment.convex.cloud`) |
| `PUBLIC_CONVEX_SITE_URL` | Yes | Convex site URL for HTTP actions (e.g. `https://your-deployment.convex.site`) |
| `PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key |

### Convex deployment

| Variable | Required | Description |
| --- | --- | --- |
| `CLERK_JWT_ISSUER_DOMAIN` | Yes | Clerk JWT issuer domain for Convex auth (`src/convex/auth.config.ts`) |
| `CLERK_WEBHOOK_SECRET` | Yes | Svix signing secret for `/clerk-users-webhook` |
| `GOOGLE_API_KEY` | Yes | Server-side Google API key for geocoding and Places search |
| `TYPESENSE_URL` | Yes | Typesense cluster URL |
| `TYPESENSE_SYNC_KEY` | Yes | API key with document write access (used by Convex actions) |
| `TYPESENSE_SEARCH_KEY` | Yes | API key with search-only access |
| `TYPESENSE_BACKFILL_KEY` | Yes | Shared secret for the backfill HTTP action |
| `TYPESENSE_COLLECTION` | No | Collection name (default: `objects`) |

### Local-only / scripts

| Variable | Required | Description |
| --- | --- | --- |
| `CONVEX_DEPLOYMENT` | Dev | Deployment identifier for `convex dev` |
| `CLERK_SECRET_KEY` | Dev | Clerk secret key (server-side auth in SvelteKit) |
| `TYPESENSE_ADMIN_KEY` | Scripts | Admin key for Typesense setup and backfill scripts |

### Production (adapter-node)

| Variable | Required | Description |
| --- | --- | --- |
| `ORIGIN` | Yes | Full app origin for CSRF protection (`svelte.config.js` enables `checkOrigin` in production) |
| `NODE_ENV` | Yes | Set to `production` |

### Client-side Google Maps

The Maps JavaScript API key and map ID are configured in `src/lib/config/index.ts` (not via env vars). The server uses `GOOGLE_API_KEY` separately for geocoding and Places.

## Clerk setup

1. Create a Clerk application and copy the publishable/secret keys.
2. Create a JWT template named **`convex`** (Clerk → JWT Templates → Convex preset).
3. Set `CLERK_JWT_ISSUER_DOMAIN` in Convex to the issuer URL from the template.
4. Add a webhook endpoint pointing to your Convex site URL:
   ```
   https://<deployment>.convex.site/clerk-users-webhook
   ```
5. Subscribe to `user.created`, `user.updated`, and `user.deleted` events.
6. Copy the signing secret to `CLERK_WEBHOOK_SECRET` in Convex.

## Typesense setup

### 1. Create the collection

Run the setup script (requires `TYPESENSE_URL` and `TYPESENSE_ADMIN_KEY`):

```bash
bun scripts/typesense/setup.ts \
  --url "$TYPESENSE_URL" \
  --admin-key "$TYPESENSE_ADMIN_KEY"
```

This creates the `objects` collection (or the name in `TYPESENSE_COLLECTION`) and generates scoped API keys.

### 2. Configure Convex env vars

Set the keys produced by the setup script (or create manually in the Typesense dashboard):

- `TYPESENSE_SYNC_KEY` — write access for Convex sync actions
- `TYPESENSE_SEARCH_KEY` — read-only search access
- `TYPESENSE_BACKFILL_KEY` — shared secret matching the backfill action guard

### 3. Backfill existing data

After the collection exists and Convex is configured:

```bash
bun scripts/typesense/backfill.ts \
  --convex-url "$PUBLIC_CONVEX_URL" \
  --backfill-key "$TYPESENSE_BACKFILL_KEY" \
  --typesense-url "$TYPESENSE_URL" \
  --typesense-admin-key "$TYPESENSE_ADMIN_KEY"
```

Both scripts accept env vars instead of CLI flags. See file headers in `scripts/typesense/`.

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| Convex queries return "Unauthorized" | Clerk JWT template missing or `CLERK_JWT_ISSUER_DOMAIN` mismatch |
| Users not appearing in Convex | Webhook not configured or `CLERK_WEBHOOK_SECRET` wrong |
| Search returns no local results | Typesense not set up, keys missing, or collection not backfilled |
| Geocoding fails on point create | `GOOGLE_API_KEY` not set in Convex, or Geocoding API not enabled |
| CSRF errors in production | `ORIGIN` env var not matching the deployed URL |
| Typesense out of sync | Sync is async; check Convex logs. Re-run backfill if needed. |
