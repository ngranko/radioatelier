# Route planning over selected markers

> **Status:** feasibility study for future work. Nothing described here is implemented today.

## Verdict

The feature is buildable on the current stack. Nothing in SvelteKit, Convex, or the Google Maps
provider blocks it, and no stack replacement is required. What is missing is not capability but
four things the project simply does not have yet: a way to group markers, a routing API surface
(only Geocoding and Places are wired today), per-object visit-time data, and a polyline primitive
on the map.

The one part that cannot be bought off the shelf is the **mixed walk/transport optimisation**. No
single API optimises a multimodal tour where some legs are walked and others use transit or a taxi.
That part must be composed by us out of several single-mode calls plus our own scheduling pass. It
is a solvable engineering problem, but it is the reason this is a multi-phase feature rather than
one API call.

The **sunset cut-off is the cheapest part of the whole feature** — sunset and civil twilight are a
closed-form astronomical calculation from latitude, longitude, and date. No API, no network, no
cost.

## Scope breakdown

The request decomposes into five capabilities with very different difficulty:

| # | Capability                                     | Difficulty | Blocking gap                                        |
| - | ---------------------------------------------- | ---------- | --------------------------------------------------- |
| 1 | Select several markers / group them            | Low        | No selection state, no `collections` table          |
| 2 | Compute an optimal order through them          | Medium     | No routing API enabled; cost model matters          |
| 3 | Say which legs to walk vs take transport       | High       | No API does multimodal tours; must be composed      |
| 4 | Schedule against current time + visit duration | Medium     | No visit-duration data anywhere in the schema       |
| 5 | Sunset feasibility and where to cut the walk   | Low        | None — local astronomical calculation               |

## What the current stack already gives us

- **Convex actions as the API seam.** `src/convex/search/googlePlaces.ts` already calls Google web
  services server-side using `GOOGLE_API_KEY` from the Convex deployment. A routing module drops
  into the same seam, and the server key never reaches the browser.
- **A provider-abstracted map.** `MapProvider` (`src/lib/interfaces/map.ts`) hides Google behind a
  small interface, so a route polyline can be added as one more handle type without leaking vendor
  detail into components.
- **Deck.gl already in the bundle.** `@deck.gl/layers` is a dependency, so a `PathLayer` route
  overlay is available if we prefer it over native polylines.
- **Client-side geolocation.** `src/lib/services/map/geolocation.ts` polls position into
  `localStorage.lastPosition`, so "start the route from where I am" needs no new plumbing.
- **A precedent for ephemeral map-wide collections of points.** `searchPointList.svelte.ts` is
  exactly the shape a selection set needs — keyed `$state`, lives outside the marker components, so
  viewport culling unmounting a marker does not drop it from the set.
- **Vitest.** The solver and the scheduler are pure functions and unit-testable without any API.

## Obstacles

### 1. There is no concept of a marker group

`markers` has no grouping column and there is no `collections` table.
[collection-access-control.md](./collection-access-control.md) already designs `collections` +
`collectionMarkerChunks`, but that document is scoped to *access control* and pulls in membership,
grants, and a rewrite of the hot `markers.list` query. Coupling route planning to it would put a
multi-week access-control refactor in front of a routing feature.

**Way around it:** phase 1 uses an ephemeral, client-side selection set (`$state`, persisted to
`localStorage`), which needs zero schema change. Persisted collections land later and simply become
another way to fill the same set.

### 2. Multi-select interaction fights two existing map behaviours

- Map click is debounced at 300 ms and **suppressed entirely while Deck mode is active** (zoom ≤ 10,
  see [map-architecture.md](./map-architecture.md)). Selection by tapping markers therefore only
  works in the DOM renderer at zoom > 10 unless Deck picking is wired up. In practice a walking
  route is always planned at city zoom, so restricting select mode to zoom > 10 is acceptable — but
  it must be a deliberate, communicated restriction, not a surprise.
- A single tap currently opens the details overlay. Selection needs an explicit mode toggle (or
  long-press) so the two gestures do not collide.
- `MarkerManager` culls markers outside the viewport, so selected-but-offscreen markers unmount.
  Selection state must live in a state module, never in the marker component.

### 3. No routing API is enabled, and the obvious approach is the expensive one

The Convex `GOOGLE_API_KEY` is restricted to Geocoding and Places. Routes API must be enabled and
the key's API restrictions widened (or a second server key introduced).

The costing matters more than it looks. Two shapes of solution have wildly different bills:

| Approach                                                          | Billing         | 15-stop plan          |
| ----------------------------------------------------------------- | --------------- | --------------------- |
| One `computeRoutes` with `optimizeWaypointOrder: true`            | per request     | ~$0.015               |
| Travel-time matrices (walk + drive) then our own solver           | **per element** | ~450 elements ≈ $2.25 |

Route Matrix is billed per element (origins × destinations), so a full *n²* matrix is quadratic in
price. At the commonly quoted ~$5 CPM for the Essentials element SKU, a 25-stop double matrix (1250
elements) is several dollars **per plan press**, and the 10,000-event monthly free tier is consumed
by roughly twenty plans. Waypoint optimisation inside a single `computeRoutes` call, by contrast, is
one billable request (on the higher Advanced/Pro rate, ~$15 CPM ⇒ ~$0.015).

This inverts the naive design. **Do not build the matrix-plus-own-solver architecture first**, even
though it is the textbook approach — it is roughly 150× more expensive per plan.

Hard limits to design against: `computeRoutes` accepts at most **25 intermediate waypoints**;
`computeRouteMatrix` caps at **625 elements** (100 for `TRANSIT` or `TRAFFIC_AWARE_OPTIMAL`);
`optimizeWaypointOrder` requires all waypoints to be stopovers and is incompatible with
`TRAFFIC_AWARE_OPTIMAL`. A spike must confirm that `WALK` mode is accepted together with
`optimizeWaypointOrder` before committing to the design.

### 4. Nothing optimises a mixed walk/transit/taxi tour

This is the genuinely hard obstacle, and it has three independent causes:

- **Every routing API is single-mode per request.** `computeRoutes` takes one `travelMode`. Route
  Optimization API takes one `travelMode` per vehicle (`DRIVING` or `WALKING`, the latter in beta).
  A tour that walks six legs and takes a tram for the seventh is not expressible in one call.
- **Transit does not support intermediate waypoints at all.** A transit leg must be its own
  `computeRoutes` request, so transit cannot participate in order optimisation.
- **Transit is time-dependent, and the times are what we are solving for.** A transit leg's duration
  depends on the departure time, which depends on how long the preceding stops took, which depends
  on the order. Chicken-and-egg.

**Way around it:** decide the order on walking times alone, then make the mode decision *per leg*
during the scheduling pass, when an estimated departure time for that leg already exists. Only legs
that exceed a walking threshold get a transit/drive lookup. This is a heuristic — the true optimum
might reorder stops *because* a tram exists — but for dense urban artifact hunting the order is
dominated by geography, not by transit lines.

### 5. There is no visit-duration data

`objects` has no per-object dwell time, and `categories` has no default. Adding a field to
`objectCoreFields` is not a one-line change: it ripples through `objectWriter`, the Notion sync
field mapping (`AppSyncFields`), the Typesense record, and the CSV import adapter.

**Way around it:** ladder it. A global default (5–10 min) costs nothing; a per-route override edited
in the route panel is client-side only; a `defaultVisitMinutes` on `categories` (plus per-user
override in `userCategoryMarkerStyles`, which already exists for colour and icon) is a contained
change; a per-object field is last, and only if usage shows the category default is too coarse.

### 6. "Before sunset" is probably the wrong threshold

Sunset itself is trivial to compute locally. But for photographing signs and mosaics, usable light
ends closer to the **end of civil twilight** (~25–30 min after sunset at mid latitudes, longer in
the north). Showing both, and letting the user pick which one the plan is scheduled against, is a
product decision that costs nothing technically and changes how many stops fit.

Related: truncating the tail of an optimised route is not the same as *choosing which stops to drop*.
The correct model is a prize-collecting / orienteering problem — maximise stops visited before the
deadline, which may pick a different subset entirely, not just a prefix. Truncation is a fine first
version; if it feels dumb in practice, re-solving over the reduced set is the fix.

### 7. Google Maps Platform terms restrict storing what we compute

Route content may not be pre-fetched, indexed, or stored outside the services; the narrow exception
is temporary caching for performance, capped at 30 consecutive days. So a matrix cache or a saved
plan cannot hold Google-derived durations and polylines indefinitely. Saved plans must store *our*
data — the object IDs, the order, the chosen modes, the user's settings — and re-fetch geometry and
durations on open. Walking routes also carry a mandatory beta warning that must be displayed, and
transit results have their own display and attribution rules.

### 8. The map cannot draw a line

`MapProvider` exposes markers only — no polyline, no path. Two options:

- Add `createPolylineHandle()` to the provider interface with a `GooglePolylineHandle` using
  `google.maps.Polyline` and `geometry.encoding.decodePath` (Routes API returns encoded polylines).
  Requires loading the `geometry` library alongside `places` in `configureLoader()`.
- Draw a Deck.gl `PathLayer`. But the Deck overlay is only attached at zoom ≤ 10, so the route would
  vanish at exactly the zoom levels where it is used — this needs a second always-on overlay.

The first option is smaller and stays consistent with the provider abstraction. Recommended.

## Recommended architecture

A four-stage pipeline, cheapest stage first, each stage independently useful:

```
selection set (client state)
    ↓  A. free local ordering — haversine nearest-neighbour + 2-opt
instant preview, zero API cost, also the offline/API-failure fallback
    ↓  B. one Convex action → Routes API computeRoutes (WALK, optimizeWaypointOrder)
real walking order + per-leg durations + encoded polyline, ~1 billable request
    ↓  C. scheduling pass (pure, client-side)
start time + dwell per stop → arrival/departure per stop → sunset/twilight cut-off
    ↓  D. per-leg mode decision, only for legs over the walking threshold
extra computeRoutes in TRANSIT (with that leg's estimated departureTime) or DRIVE
```

Stage C never calls anything. Stage D issues a handful of requests, not *n²*.

Suggested module layout, sized to the repo's 200-line file / 20-line function guidance:

| Module                                     | Responsibility                                        |
| ------------------------------------------ | ----------------------------------------------------- |
| `src/lib/state/routePlan.svelte.ts`        | Selection set + current plan, mirrors `searchPointList` |
| `src/lib/services/route/solver.ts`         | Nearest-neighbour + 2-opt over a cost matrix (pure)    |
| `src/lib/services/route/schedule.ts`       | Forward simulation, arrival/departure, cut-off index   |
| `src/lib/services/route/sun.ts`            | Sunset / civil twilight from lat, lng, date            |
| `src/lib/components/route/*.svelte`        | Select-mode toggle, route panel, leg list, mode chips  |
| `src/convex/routing/plan.ts`               | Action seam: selection in, ordered plan out            |
| `src/convex/routing/googleRoutes.ts`       | Routes API wire format, mirrors `search/googlePlaces.ts` |
| `MapProvider.createPolylineHandle`         | Route geometry rendering                               |

## Cost model

Per plan computation, at the widely quoted list rates (verify against the current pricing page
before committing — Google restructured these SKUs and they move):

- Stage A: **$0**
- Stage B: 1 request on the Advanced/Pro tier ≈ **$0.015**
- Stage C: **$0**
- Stage D: ~1–4 requests ≈ **$0.01–0.06**

So roughly **$0.03–0.08 per planned route**, against free monthly tiers of 10,000 Essentials /
5,000 Pro events. For a personal archive app this is effectively free; it only needs guarding
against a user hammering the button, which a debounce plus a Google Cloud daily quota cap handles.

The matrix-based alternative is ~$2–4 per plan and should only be reached for if true multimodal
optimisation turns out to be worth that.

## Alternatives considered

| Option                                                            | Verdict                                                                                                                              |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Google Route Optimization API** (`optimizeTours`)               | Best *modelling* fit — native visit durations, time windows, and penalty-based stop dropping, which is exactly the sunset cut-off. But single travel mode per vehicle, so it does not solve the multimodal part, and it is per-shipment billing plus another API to enable. Worth revisiting if stop counts exceed 25 or constraints get richer. |
| **Route Matrix + own solver**                                     | The only shape that supports genuine mixed-mode optimisation, but quadratic per-element billing makes it 100× more expensive per plan. Keep as a documented escape hatch.                                                                       |
| **Self-hosted OSRM / Valhalla / VROOM**                           | Free at any volume and Valhalla ships a TSP-style optimised-route endpoint. But the project is entirely serverless (Convex + SvelteKit on Node); this introduces a VM, OSM extracts, and tile rebuilds. Only justified if API cost ever becomes real, which at this scale it will not.                                          |
| **Hand off to Google Maps app with waypoints**                    | Nearly free and zero routing code, but it leaves the app, caps at ~10 waypoints in a URL, does not optimise order, and cannot express visit durations or the sunset cut-off. Fails the "without leaving the app" requirement outright. Still worth keeping as a "open in Google Maps" secondary action for navigation.               |

## Phased plan

**Phase 0 — product decisions.** Sunset vs civil twilight. "Optimal" means shortest total time or
most stops before the deadline. Whether taxi is offered at all (there is no fare API — we can show
time, not price). Whether selection is ephemeral or persisted from day one.

**Phase 1 — selection, no backend.** Select mode toggle, tap-to-select on DOM markers, selection
count chip, route panel skeleton listing selected objects. Stage A ordering by haversine so the
panel shows a plausible order immediately. Ship with zero API cost and validate the interaction.

**Phase 2 — real walking route.** Enable Routes API, add `src/convex/routing/`, wire Stage B, add
the polyline handle to `MapProvider`, render ordered badges on selected markers. Set a Google Cloud
daily quota before the first deploy.

**Phase 3 — time and sunset.** Start-time control (default: now, from `lastPosition` as origin),
global dwell default, `sun.ts`, the scheduling pass, and the cut-off UI: per-stop ETA, the twilight
line drawn in the leg list, "these 3 stops will not fit" with a one-tap trim.

**Phase 4 — transport legs.** Walking threshold setting, Stage D per-leg transit/drive lookups,
mode icons and per-leg detail (line names, wait time) in the leg list, mandatory walking-beta and
transit attribution notices.

**Phase 5 — persistence and sharing.** Save a plan as our own record (object IDs + order + settings,
no Google-derived content), reopen and recompute. This is the natural point to converge with
`collections` from [collection-access-control.md](./collection-access-control.md).

**Phase 6 — optional escalation.** Category-level visit durations; re-solve rather than truncate at
the deadline; Route Optimization API or matrices if the heuristic proves inadequate in real use.

Phases 1–3 are independently shippable and already deliver most of the value; phase 4 is the one
carrying the real technical risk.

## Open questions for the spike

1. Does `computeRoutes` accept `optimizeWaypointOrder: true` together with `travelMode: WALK`, and
   how good is the returned order on ~15 real archive points?
2. How accurate are Google's walking durations for the actual cities in the archive — do they need a
   user-tunable pace multiplier?
3. Is transit coverage good enough in those cities for stage D to be worth building, or is
   walk-vs-taxi the only meaningful distinction?

## References

- [Set intermediate waypoints — Routes API](https://developers.google.com/maps/documentation/routes/intermed_waypoints)
- [Optimize the order of stops on your route — Routes API](https://developers.google.com/maps/documentation/routes/opt-way)
- [Get a transit route — Routes API](https://developers.google.com/maps/documentation/routes/transit-route)
- [Routes API usage and billing](https://developers.google.com/maps/documentation/routes/usage-and-billing)
- [Route Optimization API overview](https://developers.google.com/maps/documentation/route-optimization/overview)
- [Google Maps Platform service specific terms](https://cloud.google.com/maps-platform/terms/maps-service-terms)
