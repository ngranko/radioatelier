# Authentication and access

Clerk handles sessions. SvelteKit uses `withClerkHandler` in `src/hooks.server.ts`, and Convex validates the Clerk JWT template named `convex`. Clerk webhooks maintain the app's `users` records.

## Route access

`src/routes/(app)/+layout.server.ts` checks the Convex token before loading app pages.

| Viewer                 | Route            | Result                                                    |
| ---------------------- | ---------------- | --------------------------------------------------------- |
| Signed in with a token | Any app route    | Load categories and continue                              |
| Anonymous              | `/object/[id]`   | Continue with an empty category list for the shared view  |
| Anonymous              | Other app routes | Redirect with status 307 to `/login?ref=<path and query>` |

The exception tests the `/object/` path prefix. New routes under the app layout otherwise inherit its sign-in requirement. `/login` redirects signed-in users to `/`.

`normalizeRef` in `src/lib/utils.ts` reduces login return URLs to a safe same-origin path. Password and SSO flows carry `ref` through authentication.

## Sign-in and account recovery

The login UI lives under `src/routes/login/` and calls Clerk from the browser. There is no application sign-up route in this repository.

| Flow                    | Implementation and behavior                                                                                                |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Email and password      | `loginForm.svelte` creates a sign-in attempt and activates its completed session                                           |
| Second factor           | `secondFactorForm.svelte` submits an email code; the login form prepares it when Clerk offers `email_code`                 |
| SSO                     | `ssoButtons.svelte` shows Google, Apple, and GitHub only when the corresponding strategy is enabled in Clerk               |
| OAuth callback          | `/login/sso-callback` renders Clerk's redirect callback component                                                          |
| Forgotten password      | `/login/forgot-password` requests a `reset_password_email_code`, then submits the code and new password                    |
| Required password reset | `/login/reset-password` mounts Clerk's reset-password task UI when the current session has that task                       |
| Change password         | `/change-password` calls `user.updatePassword` with current and new passwords; available only to password-enabled accounts |

The custom second-factor form implements email codes only. Other required strategies show an additional-verification message rather than a matching input flow. A compromised-password error sends the user to forgotten-password recovery.

After password sign-in, email-code verification, or recovery, the client checks for a reset-password session task before navigating to the normalized `ref`. The login server layout still redirects requests with an authenticated `userId` to `/`; the task page does not have a separate server-side exemption.

Password change can also revoke other sessions while retaining the current one. A revocation failure shows an error but does not roll back the password change. Logout calls Clerk sign-out, clears saved map location, and navigates to `/login`.

## Object permissions

Route access and data permissions are separate. The current backend behavior is defined in `src/convex/objects.ts`.

| Operation                              | Allowed viewers                                                           |
| -------------------------------------- | ------------------------------------------------------------------------- |
| Read `objects.getDetails` by ID        | Anyone, including anonymous viewers and private-object link recipients    |
| List map markers or search the archive | Signed-in users; results include their own objects and all public objects |
| Create an object                       | A current app user                                                        |
| Edit shared object fields              | The owner                                                                 |
| Edit private tags and visited state    | The owner, or a signed-in user viewing a public object                    |
| Reposition or remove an object         | The owner                                                                 |

`isPublic` controls discovery in the catalog and search. It does not block reads by object ID. A private-object link grants a read-only view to non-owners, not personal editing rights.

Details return the viewer's own private tags and visited state. Anonymous viewers receive no private tags, `isVisited: false`, and no internal ID. Signed-in viewers receive the internal ID, including when they are not the owner.

The stored user `role` is not the authorization rule for these object operations. Collection and individual-grant permissions are a [proposal](collection-access-control.md), with no corresponding tables in the current schema.

## Server and browser identity

`src/lib/server/convexClient.ts` creates a Convex HTTP client and attaches a Clerk JWT when available. Object page loaders can call it anonymously. Create, save, and delete form actions redirect anonymous requests to login; Convex mutations enforce their own user and ownership checks.

`src/lib/components/convexClerkAuth.svelte` sets and clears Convex browser authentication and PostHog identity. Marker queries include the Clerk `authUserId`; the backend rejects mismatches. The list layout also gates retained query results with identity and stale-data checks.

Anonymous shared-link viewers cannot place map points. Closing their overlay preserves its details so the shared view can retain its server-loaded data.

## Clerk user synchronization

`POST /clerk-users-webhook` verifies Svix signatures using `CLERK_WEBHOOK_SECRET`. It handles `user.created`, `user.updated`, and `user.deleted`; deletion marks the app user as deleted.

`users.upsertFromClerk` copies email, role, `notionSyncEnabled`, and `notionUserId` from the event. Backend operations that require a current app user need this record as well as a valid Clerk session.

See [Environment](environment.md#authentication) for configuration and [Analytics](analytics.md) for event identity.
