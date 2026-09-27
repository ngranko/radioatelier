# Analytics

PostHog receives browser events, SvelteKit form-action events, and application errors. Convex functions are not instrumented with PostHog.

## Request paths

```text
Browser posthog-js -> /ingest -> fixed PostHog EU hosts
SvelteKit posthog-node -> PUBLIC_POSTHOG_HOST
```

| Module                                      | Responsibility                                           |
| ------------------------------------------- | -------------------------------------------------------- |
| `src/hooks.client.ts`                       | Browser initialization and client error capture          |
| `src/hooks.server.ts`                       | Ingest proxy before Clerk handling; server error capture |
| `src/lib/server/posthog.ts`                 | Shared server SDK client                                 |
| `src/lib/components/convexClerkAuth.svelte` | Identify and reset browser sessions                      |
| `vite.config.ts`                            | Compile the application service version                  |

The ingest proxy sends `/ingest/static/` and `/ingest/array/` to `eu-assets.i.posthog.com`; other ingest paths go to `eu.i.posthog.com`. It strips cookie and authorization headers before forwarding and sets the forwarded client IP. Changing `PUBLIC_POSTHOG_HOST` does not change these fixed EU proxy destinations.

Server captures use `PUBLIC_POSTHOG_HOST` directly and flush after form-action events and server errors.

## Configuration

Both SDKs use `PUBLIC_POSTHOG_PROJECT_TOKEN`. The browser sets `api_host: '/ingest'` and uses `PUBLIC_POSTHOG_HOST` for `ui_host`. Supply both variables through the app environment; see [Environment](environment.md).

Browser initialization enables exception capture and uses the PostHog defaults snapshot `2026-01-30`. Log metadata includes service name `radioatelier-web`, development or production environment, and `__APP_SERVICE_VERSION__`.

The service version combines `package.json` version with the first seven characters of `GIT_COMMIT_SHA`, falling back to `local`. The Docker build also accepts Railway's commit argument. `svelte.config.js` uses absolute asset paths for session replay.

## Renderer feature flag

`src/lib/services/map/gpuRendererFlag.ts` evaluates `map-gpu-clustered-renderer` once while the map initializes. The name is historical; it selects the sprite-based GPU renderer without clustering.

An enabled flag selects GPU mode. Disabled, missing, failed, or timed-out evaluations select the legacy zoom-based renderer. The timeout is 1.5 seconds. Later flag refreshes do not replace the active renderer. See [Map architecture](map-architecture.md#renderer-selection).

## Identity

The browser identifies signed-in users by Clerk user ID and sets their primary email as a person property. Sign-out resets PostHog and clears Convex authentication. Anonymous viewers can emit events without an identify call.

Server form actions use the Clerk user ID, with `anonymous` as the fallback. Server errors use the distinct ID `server`.

## Events

### Browser

| Event                    | Source                        | Properties                  |
| ------------------------ | ----------------------------- | --------------------------- |
| `user_signed_in`         | `loginForm.svelte`            | `method: 'email_password'`  |
| `user_signed_in_via_sso` | `ssoButtons.svelte`           | `provider`                  |
| `user_signed_out`        | `logoutDialog.svelte`         | None                        |
| `password_changed`       | `passwordChangeDialog.svelte` | `signed_out_other_sessions` |
| `search_performed`       | `searchBar.svelte`            | `query_length`              |
| `object_viewed`          | Object page                   | `object_id`                 |
| `map_point_placed`       | App layout                    | `latitude`, `longitude`     |

### SvelteKit server

| Event            | Source                 | Properties                                           |
| ---------------- | ---------------------- | ---------------------------------------------------- |
| `object_created` | Point `save` action    | `object_id`, `is_public`, `is_visited`               |
| `object_updated` | Object `save` action   | `object_id`, `is_public`, `is_visited`, `is_removed` |
| `object_deleted` | Object `delete` action | `object_id`                                          |
| `server_error`   | Server error hook      | `error`, `status`, `message`                         |

Client errors call `posthog.captureException(error)`. Server errors emit `server_error` and flush.

## Adding or debugging events

Capture UI interactions in the browser. Capture successful persisted form changes in server actions with `getPostHogClient()`, `capture`, and `await flush()`. Use stable snake_case names. The current identity mapping includes Clerk ID and email; keep event properties limited to the data needed for the interaction.

For missing events, check the project token, target project, and ingest requests. For host mismatches, inspect both `PUBLIC_POSTHOG_HOST` and the fixed EU proxy. For incorrect release tags, check build-time commit configuration. Replay asset issues should be checked against `kit.paths.relative: false`.
