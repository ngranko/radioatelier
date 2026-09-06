# Authentication

The app uses [Clerk](https://clerk.com) for sign-in and [Convex](https://convex.dev) for backend auth. SvelteKit wires them together through `svelte-clerk` (`withClerkHandler` in `src/hooks.server.ts`) and a Convex JWT template named `convex`.

## Default: closed with explicit exceptions

Route access follows a **closed-by-default** model. `(app)/+layout.server.ts` is the central gate:

| Condition | Behavior |
| --------- | -------- |
| Signed in | Load continues; `(app)/+layout.server.ts` fetches `api.categories.list` |
| Anonymous + path starts with `/object/` | Load continues with `{categories: []}` — shared object pages stay reachable |
| Anonymous + any other `(app)` path | `307` redirect to `/login?ref=<original path + query>` |

Individual pages and form actions add their own checks where needed (see below). New routes under `(app)` inherit the layout gate automatically — no per-page opt-in is required.

### Public anonymous surface

Today the only anonymous `(app)` route is **`/object/[id]`** (read-only object view via shared links). Everything else under `(app)` — map home (`/`), `/point`, `/settings`, `/import`, search-driven flows — requires sign-in.

Anonymous viewers on `/object/[id]`:

- See object details in the overlay (SSR + Convex `objects.getDetails` without auth)
- Cannot save, delete, or create objects (server actions redirect to login)
- Cannot place map points (`handleMapClick` in `(app)/+layout.svelte` returns early when `!clerkCtx.auth.userId`)
- Close the overlay with `preserveDetails: true` so SSR values are not lost on close

### Login return URL

Redirects and login forms carry a `ref` query param (pathname, optionally with search). After sign-in, `normalizeRef` in `src/lib/utils.ts` resolves it to a safe same-origin pathname. SSO and password flows preserve `ref` through forgot-password and reset-password routes.

`/login` itself redirects signed-in users to `/` (`login/+layout.server.ts`).

## Server-side Convex client

`getConvexClient` (`src/lib/server/convexClient.ts`) builds a `ConvexHttpClient` and attaches the Clerk JWT when present. Anonymous SSR for `/object/[id]` calls Convex without auth; queries that require a user throw on the backend.

## Mutations and form actions

| Action | File | Anonymous behavior |
| ------ | ---- | ------------------ |
| Create object | `point/+page.server.ts` `save` | Redirect to `/login?ref=…` |
| Update object | `object/[id]/+page.server.ts` `save` | Redirect to `/login?ref=…` |
| Delete object | `object/[id]/+page.server.ts` `delete` | Redirect to `/login?ref=…` |

Client-side forms show a toast ("Пользователь не авторизован") when a redirect response arrives from Superforms.

## Client-side identity

`convexClerkAuth.svelte` syncs Clerk session state to the Convex client and PostHog identify/reset. See [analytics.md](./analytics.md) for event identity rules.

Marker list queries pass `authUserId` to Convex; the server rejects a mismatched id so retained client data cannot leak across account switches. See [map-architecture.md](./map-architecture.md).

## Setup

Clerk and Convex env vars, JWT template, and webhook configuration are documented in [environment.md](./environment.md#authentication-clerk--convex).

## Related docs

- [collection-access-control.md](./collection-access-control.md) — planned collection-based marker access (not yet enforced)
- [object-details-overlay.md](./object-details-overlay.md) — anonymous overlay close behavior
