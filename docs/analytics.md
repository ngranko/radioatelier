# Analytics (PostHog)

Product analytics and error tracking use [PostHog](https://posthog.com/) on the SvelteKit app. Convex functions are **not** instrumented — events fire from browser code and SvelteKit server actions/loaders only.

## Architecture

```
Browser (posthog-js)
    init in hooks.client.ts
    api_host → /ingest (same origin)
         ↓
SvelteKit server (hooks.server.ts)
    /ingest/* reverse proxy → eu.i.posthog.com / eu-assets.i.posthog.com
         ↓
PostHog EU project

SvelteKit server actions (+page.server.ts)
    posthog-node via getPostHogClient()
    direct to PUBLIC_POSTHOG_HOST (no proxy)
```

| Layer         | Package        | Entry point                                                       |
| ------------- | -------------- | ----------------------------------------------------------------- |
| Client SDK    | `posthog-js`   | `src/hooks.client.ts` (`init`), direct imports in components      |
| Server SDK    | `posthog-node` | `src/lib/server/posthog.ts` → `getPostHogClient()`                |
| Ingest proxy  | —              | `src/hooks.server.ts` — routes `/ingest` before the Clerk handler |
| User identity | —              | `src/lib/components/convexClerkAuth.svelte`                       |

The `/ingest` proxy keeps browser requests on the app origin so ad blockers and third-party cookie restrictions are less likely to drop client events. Static assets and feature-flag payloads use `eu-assets.i.posthog.com`; everything else goes to `eu.i.posthog.com`. The proxy forwards `x-forwarded-for` from the incoming request.

Server-side captures (`posthog-node`) talk to `PUBLIC_POSTHOG_HOST` directly. Each capture in form actions is followed by `await posthog.flush()` because the client uses `flushAt: 1` and `flushInterval: 0` for immediate delivery.

## Configuration

### Environment variables

Set in `.env.local` (see `.env.local.example`):

| Variable                       | Used by                                                               |
| ------------------------------ | --------------------------------------------------------------------- |
| `PUBLIC_POSTHOG_PROJECT_TOKEN` | Client init and server `PostHog` client                               |
| `PUBLIC_POSTHOG_HOST`          | Server SDK host; client `ui_host` (PostHog app URL for toolbar/links) |
| `GIT_COMMIT_SHA`               | Build-time only — first 7 chars baked into `__APP_SERVICE_VERSION__`  |

`GIT_COMMIT_SHA` is read in `vite.config.ts` at build time. When unset locally it defaults to `local`, producing a service version like `0.8.0+local`. Production deploys (e.g. Railway) should set `GIT_COMMIT_SHA` so PostHog logs and exception reports include the deployed commit.

### Client init

`hooks.client.ts` registers `init()` via SvelteKit hooks:

- `api_host: '/ingest'` — proxied ingest (see above)
- `defaults: '2026-01-30'` — PostHog project default config snapshot
- `capture_exceptions: true` — unhandled client errors go to PostHog
- `logs.serviceName: 'radioatelier-web'`, `logs.environment` (`development` / `production`), `logs.serviceVersion: __APP_SERVICE_VERSION__`

`svelte.config.js` sets `kit.paths.relative: false` so asset URLs stay absolute — required for PostHog session replay with SSR.

## User identification

`convexClerkAuth.svelte` ties PostHog identity to Clerk:

- On sign-in: `posthog.identify(clerkUserId)` (Clerk user id string)
- On sign-out or session cleared: `posthog.reset()` before clearing Convex auth

Server form actions use `locals.auth().userId ?? 'anonymous'` as `distinctId`. Anonymous viewers still emit client events (e.g. `object_viewed`) without an identify call.

## Event catalog

### Client events

| Event                    | Source                        | Properties                                                   |
| ------------------------ | ----------------------------- | ------------------------------------------------------------ |
| `user_signed_in`         | `loginForm.svelte`            | `method: 'email_password'`                                   |
| `user_signed_in_via_sso` | `ssoButtons.svelte`           | `provider` (Clerk strategy)                                  |
| `user_signed_out`        | `logoutDialog.svelte`         | —                                                            |
| `password_changed`       | `passwordChangeDialog.svelte` | `signed_out_other_sessions`                                  |
| `search_performed`       | `searchBar.svelte`            | `query_length` (debounced, min length 2)                     |
| `object_viewed`          | `object/[id]/+page.svelte`    | `object_id` — once per navigation while overlay data loads   |
| `map_point_placed`       | `(app)/+layout.svelte`        | `latitude`, `longitude` — draft marker placed from map click |

### Server events

| Event            | Source                                 | Properties                                            |
| ---------------- | -------------------------------------- | ----------------------------------------------------- |
| `object_created` | `point/+page.server.ts` `save`         | `object_id`, `is_public`, `is_visited`                |
| `object_updated` | `object/[id]/+page.server.ts` `update` | `object_id`, `is_public`, `is_visited`, `is_removed`  |
| `object_deleted` | `object/[id]/+page.server.ts` `delete` | `object_id`                                           |
| `server_error`   | `hooks.server.ts` `handleError`        | `error`, `status`, `message` — `distinctId: 'server'` |

### Error tracking

| Surface | Handler                         | Behavior                          |
| ------- | ------------------------------- | --------------------------------- |
| Client  | `hooks.client.ts` `handleError` | `posthog.captureException(error)` |
| Server  | `hooks.server.ts` `handleError` | `server_error` event + flush      |

## Adding events

1. **Prefer client capture** for UI interactions (clicks, views) where the user session is already identified via `posthog-js`.
2. **Use server capture** after successful mutations in `+page.server.ts` when the event must align with persisted data (create/update/delete).
3. **Server pattern:** `getPostHogClient()` → `capture({ distinctId, event, properties })` → `await posthog.flush()`.
4. **Naming:** snake_case event names; keep property keys stable for dashboards.
5. Do not capture PII beyond Clerk user ids already used as `distinctId`.

## Troubleshooting

| Symptom                              | Likely cause                                                                |
| ------------------------------------ | --------------------------------------------------------------------------- |
| No client events in dev              | Missing `PUBLIC_POSTHOG_*` in `.env.local`; restart Vite after adding       |
| Events in prod but not locally       | Expected if tokens differ per environment; check the PostHog project filter |
| Toolbar / replay issues after deploy | Confirm `kit.paths.relative: false` in `svelte.config.js`                   |
| Server events missing user           | Action ran without Clerk session — check for `'anonymous'` distinctId       |
| Wrong release in logs                | `GIT_COMMIT_SHA` not set at build time; falls back to `local`               |

## Related docs

- [environment.md](./environment.md) — env var checklist including PostHog
- [dependency-update-plan.md](./dependency-update-plan.md) — PostHog package versions and deploy verification notes
