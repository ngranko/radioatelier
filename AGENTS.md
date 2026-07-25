Do not run the build command directly — it is run automatically when needed.

Don't put comments in the code that just describe what the next code block does. Comments should explain why, not what. Only put comments in code when the reasoning behind the current implementation should be clarified to not create confusion.

Follow SOLID, DRY and KISS principles in your work. Don't create huge god-files. Soft cap for line count if a single file is 200, if a file grows bigger – consider possible refactors. The same rule should apply for huge functions: if a function grows too large – consider splitting it or moving into its own module if that function is complex enough. Soft line cap for a single function is 20 lines.

Delete unused or obsolete files when your changes make them irrelevant (refactors, feature removals, etc.), and revert files only when the change is yours or explicitly requested. If a git operation leaves you unsure about other agents' in-flight work, stop and coordinate instead of deleting.

Do not write too much code, keep your changes succinct while still fully achieving the required result.

## Cursor Cloud specific instructions

Toolchain: Node 26 (via `nvm`, set as default) and Bun are pre-installed. The system ships a Node 22 at `/exec-daemon/node`; `~/.bashrc` prepends the nvm bin so `node`/`bun` resolve correctly in login shells. Package manager is Bun (`bun install`). Standard scripts live in `package.json` (`lint`, `test`, `check`, `dev`); `bun run lint` auto-fixes (`--fix`). Per repo rule, do not run the build directly.

`.env.local` (gitignored) must exist for both `$env/static/public` type generation (`bun run check`) and the dev server; a placeholder file is present in the VM. Convex backend env vars live on the deployment, not in `.env.local` — set them with `bunx convex env set NAME value` (placeholders are already set on the local deployment).

Running the app in cloud (no Convex account): the backend uses an anonymous local Convex deployment. Start with `export CONVEX_AGENT_MODE=anonymous` first, then `bun run dev` (runs `convex dev` + `vite dev`). This serves the backend on `http://127.0.0.1:3210` and Vite on `http://localhost:5173`. Without `CONVEX_AGENT_MODE=anonymous`, `convex dev` blocks on interactive cloud login.

Web UI secret requirement: SvelteKit SSR calls Clerk on every route, so with placeholder keys every page returns HTTP 500 with `Error: Publishable key not valid`. Rendering the UI requires real `PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY`, and the map requires a real `PUBLIC_GOOGLE_MAPS_API_KEY` + `PUBLIC_GOOGLE_MAPS_MAP_ID`. `handleError` in `src/hooks.server.ts` swallows the SSR stack (generic 500 body); read the Vite terminal or temporarily `console.error` there to debug SSR.

Backend core logic can be exercised without Clerk/Google by calling functions directly against the local backend, e.g. `bunx convex run objects:getDetails '{"id":"..."}'` (use `CONVEX_AGENT_MODE=anonymous`). Convex logic is unit-tested as plain TS modules (see `docs/testing.md`); tests need no running services.
