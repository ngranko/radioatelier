# Dependency update & tooling migration plan

Snapshot from `bun outdated`, 2026-07-18. Each phase is one commit, verified (`check`, `test`, `lint`, smoke in the running dev server) before moving on.

## Outdated dependencies

### In-range (semver-compatible, picked up by `bun update`)

| Package | Current | Target |
| --- | --- | --- |
| convex | 1.31.7 | 1.42.3 |
| @convex-dev/migrations | 0.3.1 | 0.3.5 |
| @deck.gl/core / google-maps / layers | 9.1.14 | ~~9.3.7~~ **pinned `~9.1.14`** — 9.3 regression, see Deferred |
| @lucide/svelte | 1.7.0 | 1.25.0 |
| @selemondev/svgl-svelte | 2.15.0 | 2.17.0 |
| tailwindcss + @tailwindcss/vite | 4.1.7 | 4.3.3 |
| eruda | 3.4.1 | 3.4.3 |
| posthog-js | 1.400.1 | 1.404.1 |
| posthog-node | 5.42.0 | 5.45.2 |
| svelte-easy-crop | 5.0.0 | 5.0.1 |
| svix | 1.84.1 | 1.98.0 |
| typesense | 3.0.2 | 3.0.6 |
| zod | 4.1.12 | 4.4.3 |
| @sveltejs/kit | 2.53.4 | 2.70.0 |
| @sveltejs/adapter-node | 5.2.13 | 5.5.7 |
| svelte | 5.53.6 | 5.56.6 |
| svelte-check | 4.4.4 | 4.7.3 |
| bits-ui | 2.11.4 | 2.18.1 |
| sveltekit-superforms | 2.28.0 | 2.30.2 |
| svelte-sonner | 1.0.5 | 1.1.1 |
| tailwind-merge / tailwind-variants / tw-animate-css | — | latest minor |
| vitest | 4.1.8 | 4.1.10 |
| vite | 6.4.1 | 6.4.3 |
| typescript | 5.6.3 | 5.9.3 |
| bun-types, concurrently 9.x, @types/google.maps, @types/node 25.x | — | latest minor |

### Major bumps (need individual attention)

| Package | Current → Latest | Impact |
| --- | --- | --- |
| convex-svelte | 0.0.12 → 0.14.0 | Needs convex ≥1.30 and svelte ≥5.19 (both satisfied after the in-range sweep). API is mostly additive (`useMutation`, `useAction`, `setupAuth`, `convex-svelte/sveltekit` subpath); `setupConvex` now throws if called twice with different URLs. Used in ~20 files but call sites (`useQuery`) are unchanged. |
| svelte-clerk | 0.20.4 → 1.1.11 | `<SignedIn>`/`<SignedOut>`/`<Protect>` replaced by `<Show when=...>`. Only `src/lib/components/userMenu/userMenu.svelte` uses them. Bundles @clerk/backend 3 / @clerk/shared 4 — retest sign-in/out, SSR auth (`hooks.server.ts`), and the svix webhook path. |
| @googlemaps/js-api-loader | 1.16.8 → 2.1.1 | v2 removes the `Loader` class in favor of a functional bootstrap. Only `src/lib/services/map/providers/google/provider.ts` touches it. Optional — 1.16.10 is fine. |
| vite | 6 → 8 | Coupled with @sveltejs/vite-plugin-svelte 6→7 (which requires Vite 8) and vite-plugin-cjs-interop 2→4. SvelteKit 2.70 supports Vite 5–8. Verify @tailwindcss/vite and vitest peer ranges before jumping. |
| @sveltejs/adapter-auto | 3 → 7 | Unused — `svelte.config.js` uses adapter-node. Remove instead of updating. |
| concurrently | 9 → 10 | Trivial; dev-script only. |
| eslint 9→10, @eslint/js 9→10, globals 15→17, @types/eslint__js | — | Superseded by the oxlint migration below. |
| typescript | 5.9 → 7.0 | Go to **6.0.3** (Phase 3b step 0) — the final JS-based release, aligned with TS7 semantics and inside every consumer's peer range. TS 7 itself (native port) stays deferred: SvelteKit peers `^5.3.3 \|\| ^6.0.0` and @typescript-eslint/parser caps at `<6.1.0`. |
| @types/node | 25 → 26 | Bump together with the Node 26 runtime upgrade (Phase 6). |
| prettier-plugin-svelte 3→4, prettier-plugin-tailwindcss 0.6→0.8 | — | Moot — removed with prettier. |

## Phases

### Phase 1 — in-range sweep
`bun update`, then `bun run check`, `bun run test`, smoke the app. This also lands convex 1.42 and svelte 5.56, which are prerequisites for convex-svelte 0.14. One commit.

### Phase 2 — remove @sveltejs/adapter-auto
Dead dependency; adapter-node is the configured adapter.

### Phase 3 — eslint → oxlint (oxlint 1.74.0)
Oxlint lints TS/JS and the `<script>` blocks of `.svelte` files, but has **no Svelte template linting yet** (planned later in 2026). The current config's custom rules (`curly: all`, `no-unused-vars` with `argsIgnorePattern: '^_'`) are both supported by oxlint.

1. `bun add -d oxlint`; generate `.oxlintrc.json` (optionally seed with `bunx @oxlint/migrate`): default correctness category + the two custom rules; ignore `.svelte-kit`, `build`, `convex/_generated`.
2. Keep a **slim hybrid ESLint** for template rules only: config reduced to `eslint-plugin-svelte` flat/recommended scoped to `**/*.svelte` (parsers: svelte-eslint-parser + @typescript-eslint/parser). Add `eslint-plugin-oxlint` last to disable rules oxlint already covers.
3. `lint` script: `oxlint --fix . && eslint --fix .`
4. Remove: `@eslint/js`, `typescript-eslint`, `@types/eslint__js`, `globals`, `eslint-plugin-prettier`, `eslint-config-prettier`.
   Keep: `eslint`, `eslint-plugin-svelte`, `svelte-eslint-parser`, `@typescript-eslint/parser`.
5. Exit criterion for dropping ESLint entirely: oxlint ships Svelte template support.

#### Phase 3b — type-aware linting (separate commit, after base oxlint is green)

Type-aware rules come from `oxlint-tsgolint`, a Go binary embedding typescript-go (the native TS7 compiler). It does **not** use the repo's installed `typescript` package — "TypeScript 7.0+ required" means the tsconfig and code must be TS7-compatible (no options deprecated in TS 6.0 / removed in 7.0, e.g. `baseUrl`), not that `typescript@7` must be installed. The repo therefore stays on typescript 5.9 for svelte-check/tsc while tsgolint checks with TS7 semantics. Our tsconfig is already clean: modern options only (`moduleResolution: bundler`, `verbatimModuleSyntax`, `paths` without `baseUrl`).

0. First, bump the repo's `typescript` to **6.0.3** (own commit). Every consumer accepts it: svelte-check peers `>=5.0.0`, svelte2tsx `^6.0.0`, @typescript-eslint/parser `<6.1.0` (satisfied — 6.0 is the final JS-based line, 6.1 will never exist), convex has no TS peer, and vite/esbuild only transpile. TS 6.0 is the bridge release aligned with TS7: it emits deprecation warnings for everything TS7 removed, so `check` itself validates the same compatibility bar tsgolint enforces, and tsc-vs-tsgo semantic drift shrinks to near zero. Expect possibly a few new diagnostics from lib.d.ts changes; fix them here.
1. `bun add -d oxlint-tsgolint`; enable via `options.typeAware: true` in `.oxlintrc.json` (or `oxlint --type-aware`).
2. Trial run first: today's ESLint config uses tseslint `recommended`, *not* `recommendedTypeChecked`, so type-aware rules (`no-floating-promises`, `no-misused-promises`, …) are a net-new wave of diagnostics. Triage, fix the real ones, disable the noisy ones explicitly rather than downgrading the whole category.
3. Caveats: type-aware rules cover `.ts`/`.js` only — `.svelte` script blocks are excluded (convex functions, map services, and hooks are where the type-heavy logic lives, so coverage is still meaningful). tsgolint reads `tsconfig.json`, which extends the generated `.svelte-kit/tsconfig.json` — CI lint steps must run `svelte-kit sync` first (locally the dev server keeps it fresh). Known gap: typescript-go doesn't support `rootDirs` (sveltejs/kit#13970), which SvelteKit's generated config uses to resolve `./$types` imports in route files — expect degraded type info or false positives in `+page/+layout/+server` files during type-aware linting; if noisy, scope type-aware rules to exclude `src/routes` until upstream support lands. `src/lib` and `src/convex` are unaffected.
4. Two checkers now coexist (tsc 6.0 for `check`, tsgo/TS7 for lint). With the repo on 6.0 the semantics are near-identical; when they disagree, `svelte-check` is the source of truth for shipping.

### Phase 4 — prettier → oxfmt (oxfmt 0.59.0)
Oxfmt replaces all three prettier plugins natively: `svelte` formatting option (experimental, uses the already-installed `svelte` package), `sortTailwindcss` (replaces prettier-plugin-tailwindcss; point it at the CSS entry that has `@import "tailwindcss"` since this is Tailwind v4), and `sortImports` (replaces the sorting half of prettier-plugin-organize-imports).

1. `bun add -d oxfmt`; create `.oxfmtrc.json` translating `.prettierrc`: `printWidth: 100`, `tabWidth: 4`, `singleQuote: true`, `bracketSpacing: false`, `arrowParens: "avoid"` (semi/trailingComma "all" are oxfmt defaults), plus the svelte, sortImports, and sortTailwindcss options.
2. `format` script → `oxfmt .`; delete `.prettierrc`, `.prettierignore`, and the four prettier packages.
3. Run one repo-wide reformat as its own commit (import order and some layout will churn — oxfmt's sorter is perfectionist-style, not TS-language-service-style). Add the commit hash to `.git-blame-ignore-revs`.
4. Review the `.svelte` diff carefully — Svelte formatting is experimental. Fallback if output is unacceptable: keep prettier + prettier-plugin-svelte scoped to `*.svelte` only, oxfmt for everything else.
5. Editor note: switch the workspace formatter to the oxc VS Code extension.

Caveat: prettier-plugin-organize-imports also **removed** unused imports; oxfmt only sorts. Unused imports are now flagged by oxlint's `no-unused-vars` instead of silently deleted.

### Phase 5 — majors, one commit each, riskiest last
1. **convex-svelte 0.14** — bump, verify `setupConvex` is called once, smoke live queries.
2. **svelte-clerk 1.1** — bump, rewrite `userMenu.svelte` to `<Show>`, retest auth flows + webhooks.
3. **concurrently 10** — bump.
4. **Vite 8 + vite-plugin-svelte 7 + vite-plugin-cjs-interop 4** — verify @tailwindcss/vite and vitest peer support first; check whether the cjs-interop plugin is even still needed under Vite 8.
5. *(Optional)* **@googlemaps/js-api-loader 2** — rewrite the loader bootstrap in `provider.ts`, or stay on 1.x.

### Phase 6 — Node 26 runtime

Node 26 released 2026-05-05 (Current) and enters Active LTS on **2026-10-28**. It ships V8 14.6, Temporal enabled by default, and removes long-deprecated legacy APIs. Do this phase last, after the dependency sweep and majors have settled — newer dependency versions are more likely to be Node-26-clean.

1. `docker/app/Dockerfile`: `node:22-alpine` (build stage) and `node:22.9-alpine` (prod stage) → `node:26-alpine` / a pinned `node:26.x-alpine`. Keep the two stages on the same major so the `npm prune`d node_modules from build matches prod.
2. `package.json` engines: `node >=22.9.0` → `>=26.0.0`.
3. `bun add -d @types/node@^26`.
4. Verify: local docker build of the prod target, smoke `node build` (adapter-node output), then a Railway deploy watched through the PostHog log integration. Pay attention to native/legacy-API users in the server bundle (posthog-node, svix, typesense clients) since 26 removed deprecated APIs.
5. Timing call: shipping it now means running Current in production for ~3 months; if that's uncomfortable, land steps 1–3 on a branch and merge on 2026-10-28 when 26 flips to LTS. The bun-based dev flow is unaffected either way (Node is only the build/prod runtime).

### Deferred deliberately
**deck.gl 9.3** — regression found during Phase 1: on vector maps, 9.3's `GoogleMapsOverlay` creates a positioning container div (`#deck-gl-google-maps-container`) that `_onRemove` never deletes; on overlay re-creation (our `setRendererMode` destroy/recreate path) duplicate-ID containers accumulate and `querySelector` resolves to the stale one — markers render mispositioned, then disappear. App-side cleanup (`finalize()` + purging leftover containers in `DeckOverlayRenderer.destroy()`, kept in the code) was not sufficient; pinned to `~9.1.14`. To retry: bisect 9.2.x → 9.3.x with the renderer-mode toggle as the repro, and consider filing upstream (no existing issue found as of 2026-07; related: visgl/deck.gl#10224 for interleaved mode).

TypeScript 7 as the repo's `typescript` package (SvelteKit and @typescript-eslint/parser peer ranges don't allow it yet; 6.0.3 lands in Phase 3b instead), eslint 10 (moot after the oxlint migration).
