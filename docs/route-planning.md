# Route planning over selected markers

> **Status:** feasibility study for future work. Nothing described here is implemented today.
> UI directions for the same feature are mocked in [route-planning-ui.html](./route-planning-ui.html) — open it in a browser.

## Verdict

The feature is buildable on the current stack. Nothing in SvelteKit, Convex, or the Google Maps
provider blocks it, and no stack replacement is required. What is missing is not capability but
two things the project simply does not have yet: a routing API surface (only Geocoding and Places
are wired today) and a polyline primitive on the map. Grouping is not among them — the route runs
over a [walk set](#the-walk-set) the user assembles, so the feature does not wait on collections.

Visit duration is deliberately **not** modelled as data. A flat 5–10 minutes per stop, corrected
live against the user's actual progress, replaces it — see [Time on location](#time-on-location).
That removes what would otherwise have been the most invasive schema change in the feature.

The one part that cannot be bought off the shelf is the **mixed walk/transport optimisation**. No
single API optimises a multimodal tour where some legs are walked and others use transit or a taxi.
That part must be composed by us out of several single-mode calls plus our own scheduling pass. It
is a solvable engineering problem, but it is the reason this is a multi-phase feature rather than
one API call.

The **sunset cut-off is the cheapest part of the whole feature** — sunset and civil twilight are a
closed-form astronomical calculation from latitude, longitude, and date. No API, no network, no
cost.

## Scope breakdown

The request decomposes into nine capabilities with very different difficulty:

| # | Capability                                     | Difficulty | Blocking gap                                          |
| - | ---------------------------------------------- | ---------- | ----------------------------------------------------- |
| 1 | Assemble the markers to walk                   | Low        | None — a transient client-side walk set                |
| 2 | Compute an optimal order through them          | Medium     | No routing API enabled; cost model matters            |
| 3 | Say which legs to walk vs take transport       | High       | No API does multimodal tours; must be composed        |
| 4 | Schedule against current time + time on location| Low       | None — flat per-stop allowance, no data needed        |
| 5 | Sunset feasibility and where to cut the walk   | Low        | None — local astronomical calculation                 |
| 6 | Re-estimate live from the user's position      | Medium     | Refresh must be tiered or it bankrupts the cost model |
| 7 | Fill from all markers vs unvisited only        | Low        | None — both flags already reach the client            |
| 8 | Exclude single stops, before or during a walk  | Low        | None — deletion preserves the fixed order             |
| 9 | Start somewhere that is not a marker           | Low        | None — the routing call already separates origin      |

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
  `localStorage.lastPosition`, so "start the route from where I am" needs no new plumbing. Live
  tracking during the walk needs it reworked (see obstacle 5), but the permission flow, the
  denied/stale fallback, and the storage key already exist.
- **A precedent for ephemeral map-wide collections of points.** `searchPointList.svelte.ts` is
  exactly the shape a selection set needs — keyed `$state`, lives outside the marker components, so
  viewport culling unmounting a marker does not drop it from the set.
- **Vitest.** The solver and the scheduler are pure functions and unit-testable without any API.

## Obstacles

### 1. There is no concept of a marker group — and the route does not need one

`markers` has no grouping column and there is no `collections` table.
[collection-access-control.md](./collection-access-control.md) already designs `collections` +
`collectionMarkerChunks`, but that document is scoped to *access control* and pulls in membership,
grants, and a rewrite of the hot `markers.list` query. Waiting for it would put a multi-week
access-control refactor in front of a routing feature.

**Way around it:** the [walk set](#the-walk-set) is transient and client-side (`$state`, persisted
to `localStorage`), so it needs no schema change and no collections. When collections do land they
become one more way to fill the set, which is an additive change rather than a dependency.

### 2. Multi-select interaction fights two existing map behaviours

- Map click is debounced at 300 ms and **suppressed entirely while Deck mode is active** (zoom ≤ 10,
  see [map-architecture.md](./map-architecture.md)). Selection by tapping markers therefore only
  works in the DOM renderer at zoom > 10 unless Deck picking is wired up. In practice a walking
  route is always planned at city zoom, so restricting select mode to zoom > 10 is acceptable — but
  it must be a deliberate, communicated restriction, not a surprise.
- A single tap currently opens the details overlay. A multi-select mode needs an explicit toggle (or
  long-press) so the two gestures do not collide.
- `MarkerManager` culls markers outside the viewport, so selected-but-offscreen markers unmount.
  The walk set must live in a state module, never in the marker component.

**How much of this actually bites depends on the entry point.** Adding a marker from the details
overlay that already opens on tap needs no new gesture, no mode, and no Deck picking — so the walk
set can be filled one marker at a time from day one, with none of the above applying. Only a bulk
select mode runs into these constraints, and with a walk set that mode is a convenience rather than
the only way in.

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

### 5. Live re-estimation is cheap to get wrong

Time on location is settled — a flat 5–10 min per stop, no schema change, one user setting (see
[Time on location](#time-on-location) below). What replaces it as an obstacle is the live half:
recomputing the plan as the walk progresses.

The naive version is a cost disaster. `geolocation.ts` already ticks every 5 seconds; hanging a
Routes API call off that tick is ~720 requests per hour of walking, turning a $0.03 plan into
roughly $10 per walk. **Live re-estimation must be free by default and only occasionally paid for.**
The tiering that achieves this is in [Live re-estimation](#live-re-estimation).

The position source also needs work before it can drive this. Today `updateCurrentPosition()` calls
`getCurrentPosition` on a 5-second `setInterval` with `enableHighAccuracy: false` and no accuracy
filtering. For "am I on route, and how fast am I actually walking" that is the wrong shape three
times over:

- **Coarse accuracy.** `enableHighAccuracy: false` yields network-derived fixes that can be tens to
  hundreds of metres out — larger than the off-route threshold we would test against.
- **Polling instead of `watchPosition`.** Interval polling burns battery for fixes we may not need
  and adds latency to the ones we do; `watchPosition` lets the OS coalesce updates.
- **No accuracy gate.** A single bad fix would corrupt the observed-pace estimate. Fixes need to be
  discarded above an accuracy threshold, and pace smoothed rather than taken from one sample.

Two further constraints are inherent to walking around a city with a phone:

- **Urban GPS drift.** Narrow streets and tall buildings are exactly where fixes are worst — and
  exactly where this app is used. Off-route detection needs generous thresholds and hysteresis, or
  it will cry wolf.
- **Backgrounding.** On a multi-hour walk the phone goes in a pocket, the page backgrounds, timers
  throttle, and `watchPosition` may stop delivering. The plan must survive a gap in position data
  and resume from the first fix after it, rather than assuming a continuous track.

Finally, a UX obstacle that is easy to miss: **the cut-off number must not flicker.** If the panel
says "you'll make 7 of 9" and every position tick flips it between 7 and 8, the feature reads as
broken. The displayed cut-off needs hysteresis — only move it when the estimate crosses the
threshold by a margin, or has held for several updates.

There is a privacy consequence too. Continuous tracking should stay entirely on the device: the
position stream drives local recalculation and never goes to Convex or PostHog. Position leaves the
device only inside an explicit routing request, which happens rarely under the tiering below.


### 6. "Before sunset" is probably the wrong threshold

Sunset itself is trivial to compute locally. But for photographing signs and mosaics, usable light
ends closer to the **end of civil twilight** (~25–30 min after sunset at mid latitudes, longer in
the north). Showing both, and letting the user pick which one the plan is scheduled against, is a
product decision that costs nothing technically and changes how many stops fit.

Related: truncating the tail of an optimised route is not the same as *choosing which stops to drop*.
The correct model is a prize-collecting / orienteering problem — maximise stops visited before the
deadline, which may pick a different subset entirely, not just a prefix.

Because the order is fixed once the walk starts (see [Live re-estimation](#live-re-estimation)),
this splits cleanly by phase. **During the walk** the cut-off is a prefix truncation by definition —
the tail is whatever the fixed order left for last — and that is the intended behaviour, not a
limitation to fix. **Before the walk starts** the solver is free to choose a better subset, so the
orienteering treatment, if it is ever worth building, belongs there and only there.

The cost of the fixed-order rule is that the stops dropped at the deadline are the ones that happen
to be last, which may not be the ones the user would have sacrificed. That is precisely what the
offered "re-plan the rest" exists to resolve, at the user's discretion rather than automatically.

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

## The walk set

**A route always runs over a walk set: a transient, hand-editable collection of markers that exists
for one walk.** It is not a collection, it is not a filter over the archive, and it is not derived
from anything — it is a concrete list the user builds, sees, and edits before setting off.

This is the single most useful structural decision in the feature, because it collapses what would
otherwise be two competing entry paths ("route this collection" and "route these markers I picked")
into one. There is exactly one thing that gets routed. Everything else is a way to fill it:

- **From a collection** — add all of it, or only the unvisited part; removed objects sit out of
  bulk fills.
- **From another collection** — sets combine, so a walk can span two collections, which routing a
  collection directly could never express.
- **By hand** — add a marker from its details overlay, or remove one from the set. This is the only
  way a removed object joins a walk, and it is deliberately allowed.

### Why this is better than routing a collection directly

- **The feature stops depending on collections.** Hand-filling works with nothing but the existing
  marker list, so route planning can ship before collections do; "fill from collection" is then one
  extra source added later, not a prerequisite. This removes the assumption the rest of this
  document previously carried.
- **The 25-waypoint cap becomes tractable.** A 60-point collection cannot be routed, but it can be
  *drawn from*. The set is where the limit lives and where it is visible — "9 / 25" — so the user
  trims deliberately instead of hitting an error.
- **Collections stay untouched.** Filling copies marker IDs; it does not link, subscribe, or
  reference. Editing the walk set can never edit a collection, which is the same guarantee the
  scope filter already made.
- **It largely dissolves obstacle 2.** If markers are added from the details overlay that already
  opens on tap, there is no need for a multi-select gesture competing with the existing map click,
  and no need to fight the Deck-mode click suppression. A bulk select mode becomes a nice-to-have
  for adding many at once rather than the only way in.
- **Feasibility gets cheap.** A per-collection "fits before dark" badge would mean routing every
  collection; with a walk set there is one set to evaluate, so the estimate is computed once for the
  thing the user is actually assembling.

### Lifetime

Transient means "for this walk", not "until the page reloads". The set should survive a reload
(`localStorage`, like the existing map position keys), because a walk is assembled over minutes and
often across app restarts. One active set at a time keeps the model simple.

Only archive objects can enter the set. Search returns Google Places results too, and those are not
markers; they can be used as an origin, never as a stop.

### Saving a set as a collection

**Decided: a walk set can be saved as a collection.** It is the exact inverse of filling — the same
list of marker IDs travelling the other way — so once collections exist the whole feature is a
create-collection call with pre-filled membership, a name field, and a button in the tray. Nothing
new is needed on either side.

The cost is genuinely near zero, but it is **near zero conditional on collections existing**. It is
the one part of route planning that cannot ship before them, which is fine, because it is also the
one part nobody needs on day one.

Two things must be explicit or the feature will mislead:

- **Saving copies membership, not the route.** A routed set has an order — the optimised sequence,
  the origin, the departure time. A collection is a membership set. So "save as collection" answers
  *"these places were worth grouping"*, and loses the sequence. Naming the action carefully matters
  more here than the implementation does.
- **It is a snapshot, not a link.** Later edits to the walk set do not reach the saved collection,
  and edits to the collection do not reach the walk. This is the same guarantee filling already
  makes, applied in the other direction.

That leaves two different save actions, which should stay distinct rather than collapsing into one:

| Action                    | Saves                                    | Answers                            |
| ------------------------- | ---------------------------------------- | ---------------------------------- |
| Save set as collection    | Marker IDs                               | "These places are worth keeping"   |
| Save plan (phase 6)       | Marker IDs, order, origin, settings       | "This walk, resumable"             |

A sensible default name — the date, or the collection it was mostly filled from — keeps the action
one tap rather than a form.

## Filling the set: all markers vs unvisited only

The all/unvisited choice applies **when the set is filled**, not as a live filter over it. Once
markers are in the set, the set is literal: what you see is what you walk.

- **All** — every marker in the source.
- **Unvisited only** — markers the user has not marked as visited.

Both skip removed objects, which can still be added individually — see below.

Making the toggle a fill option rather than a persistent mode has a pleasant consequence: switching
it becomes a **set operation, not a rebuild**. Turning "unvisited only" off adds the visited markers
from the same source; turning it back on removes them again. Hand-added markers survive both,
because nothing is ever regenerated from scratch. A live filter would have to either discard manual
edits or maintain a confusing distinction between "filtered out" and "removed by me".

**Removed objects are excluded from bulk fills, but can be added by hand.** Pouring a collection
into a walk should never quietly pad it with objects that are gone — that is a default nobody would
want overridden. But *deliberately* adding one is a different act with real reasons behind it:

- checking whether something recorded as gone is actually gone, which is how a removal gets
  confirmed or reversed;
- photographing the site anyway — an empty wall where a mosaic was is still archive material;
- suspecting the removal was a mistake, or simply wanting to look.

So the rule is a bulk default, not a prohibition. **Explicit beats implicit:** filling from a
collection skips removed objects and says so, while tapping one and adding it works, because at that
point the user is looking at a marker the app already renders as removed and has decided anyway.

Three consequences:

- **The set must show it.** A removed stop needs to stay visibly marked in the itinerary, or the
  user arrives at an empty wall having forgotten why it was on the list. `isRemoved` already reaches
  the marker rendering layer, so the styling exists.
- **The scope toggle must not sweep it away.** Turning "unvisited only" on and off adds and removes
  markers *from that source only*; a hand-added removed object is not part of that set operation and
  survives both directions, like any other manual addition.
- **A removal discovered later is a question, not an eviction.** If an object in the set is marked
  removed before the walk begins, the panel should say so and let the user decide, rather than
  dropping a stop they may have wanted precisely because it is gone. Mid-walk, nothing changes at
  all — see [Route scope](#filling-the-set-all-markers-vs-unvisited-only) above.

Nothing else needs special-casing: a removed stop takes the same flat time allowance, and the
arrival actions are the same ones offered anywhere, with the natural outcomes being confirming the
removal or reversing it. A bulk "add the removed ones" fill — an audit walk over everything recorded
as gone — is a plausible third option later, but it is not needed to support the case above.

This needs no backend work and no schema change. Both flags already reach the client today:
`markers.list` returns `isRemoved` on every `MarkerListItem`, and `markers.listVisitedIds` returns
the user's visited object IDs, which `(fullList)/+layout.svelte` already merges into an `isVisited`
field per rendered marker. Filling the set is a pure predicate over a list the app has already
loaded.

Three behaviours are worth pinning down, because the obvious implementation gets them wrong:

- **Marking something visited mid-walk changes nothing about the current walk.** Visited state is
  always a manual action, never inferred from arrival, and logging it must not make the stop you are
  standing at vanish. The set was materialised when it was filled; it does not re-filter itself. See
  [The route never writes archive state](#the-route-never-writes-archive-state).
- **Say what was left out.** Filling from a collection of 12 and getting 9 markers looks broken
  unless the panel says why — "3 visited, skipped" or "2 removed, skipped". Silence reads as a bug.
- **Handle the empty result.** "Unvisited only" over a fully visited collection adds nothing. That is
  a legitimate and pleasant outcome — you have seen everything — and deserves a real empty state
  rather than a zero-stop route.

If an object is marked removed or visited between saving a plan and reopening it, the plan reports
what changed rather than silently rewriting itself.

## Excluding individual stops

Scope is the bulk filter; excluding single stops is the manual one. It happens at two moments that
behave differently:

- **Before starting** — drop a point from the set. The route simply re-solves without it, because
  nothing is fixed until the walk begins.
- **During the walk** — skip it. You are standing in front of a locked courtyard, the light is
  going, or you have simply lost interest.

The second case looks like it should collide with the fixed-order rule, and it does not:
**removing an element is not permuting the remaining ones.** Every stop still ahead keeps both its
position and its relative order; the sequence just gets shorter. That is why skipping is safe to
allow mid-walk while re-ordering is not, and it is the cleanest justification for the rule holding
in both directions.

What skipping costs, and how it behaves:

- **Two legs collapse into one.** Skipping B between A and C invalidates the leg into B and the leg
  out of it. Summing them overstates the result — A→B→C is a detour, A→C is not — so the UI shows a
  straight-line estimate at the measured pace immediately, marks it provisional, and lets a tier-3
  refresh replace it with real geometry. **Skipping is a legitimate tier-3 trigger**, subject to the
  same rate-limit floor as the others.
- **Skipped is not visited.** A skipped object must stay unvisited, so "unvisited only" offers it
  again next time. Conflating the two would quietly delete points from the archive's backlog. This
  is one case of a broader rule — see [The route never writes archive state](#the-route-never-writes-archive-state).
- **The collection is untouched,** exactly as with the scope filter.
- **The twilight trim is a bulk skip.** "These 3 stops won't fit" applied with one tap is the same
  mechanism over every stop past the cut-off — one concept in the code and one in the user's head,
  not two.
- **Undo is free only while the stop is still ahead of you.** Restoring a skipped stop you have
  already walked past is a re-plan, because its position in the sequence no longer exists.
- **Skipping the next stop re-anchors the live loop.** The current-leg progress calculation is
  measuring toward a target that has just been abandoned, so it must reset to the new next stop
  rather than keep scaling against the old one.
- **Skipping everything ends the walk** and deserves a proper finish state rather than a zero-stop
  route.

## Where the walk starts and ends

The first marker is not the start. A walk usually begins at home, at a metro exit, or wherever the
user happens to be — a place that is not in the archive, carries no visit time, and is never
photographed. **The origin is a waypoint, not a stop**, and the design has to keep those separate.

This costs nothing to support, because the routing call is already shaped for it. `computeRoutes`
takes `origin`, `destination`, and `intermediates` as three distinct things, and
`optimizeWaypointOrder` reorders only the intermediates while leaving the endpoints fixed. So a
fixed origin is not a constraint the optimiser has to work around — **it is what makes the optimised
order meaningful in the first place**. It also does not eat the waypoint budget: the 25-intermediate
cap applies to the markers, with origin and destination on top.

### Choosing the origin

Four sources, in rough order of expected use, none of which needs a new API:

- **Current position** — the default when starting a walk now, from the existing geolocation.
- **An address or place** — the app already has Google Places search and geocoding wired into
  Convex, plus a search UI that focuses the map. Origin picking reuses all of it.
- **A remembered "home"** — worth having, since planning from home is the case that prompted this.
  A `localStorage` value is enough to start; a user field only if it needs to follow the account.
- **A point on the map**, via the same tap interaction that creates objects today.

An existing marker can also be the origin, in which case it is both the start and the first stop —
the one case where the two coincide.

### Where it ends

**Decided: the walk ends at the last marker, and the way home is not planned.** Getting home is not
constrained by daylight — photographing is — so routing it would add a leg to the plan that nobody
needs timed, and would pull minutes into a budget that only exists to protect the light. The route
is an open path: origin, then the markers, and it stops when the last one is done.

There is one non-obvious consequence. `computeRoutes` **requires** a destination, and
`optimizeWaypointOrder` reorders only the intermediates while holding both endpoints fixed. So an
open path still needs someone to decide *which marker ends the route* — the API will not choose it.

**Decided: the destination is derived from stage A.** The free local ordering already walks the set
from the origin; its last stop becomes the destination and everything between goes in as
intermediates. Asking for a loop and discarding the closing leg is explicitly rejected — it
optimises for a shape the user is not walking.

This changes stage A's status in the pipeline. It was a throwaway preview and an offline fallback;
it is now **a required input to stage B**, because stage B cannot be called without the endpoint
stage A picks. The two stages are sequential rather than alternatives, and stage A's output quality
now has a real effect on the final route rather than being discarded the moment the API answers.

Two things follow from that, both cheap:

- **The endpoint heuristic deserves its own attention.** "Last stop of the nearest-neighbour pass"
  is the obvious rule, but "farthest marker from the origin" is often the better one for a walk that
  fans outward. Both are pure functions over coordinates, so they are trivial to unit-test and to
  compare against each other on real archive clusters.
- **Anything that changes the last stop changes the destination.** Dragging a row to the end in the
  planner, or skipping what was the final marker, re-derives it. That is the intuitive behaviour —
  the last row *is* the destination — and it stays consistent with the fixed-order rule, since a
  shorter sequence simply ends earlier.

Ending somewhere specific — a station, a bar — is a later refinement, not part of this. When it
lands it is just an explicit destination in place of the derived one.

### What else moves

- **The clock starts at the origin, not at the first marker.** If home is 25 minutes from the
  cluster, that is 25 minutes of daylight spent before the first photograph. The current scheduling
  pass starts too late and would overstate how much fits.
- **"Start time" means departure.** With an origin in the picture, 15:22 is when you leave, not when
  you arrive at stop 1. The label has to say which, or every estimate is off by the approach leg.
- **The approach leg is the most likely transport leg in the whole route.** It is typically the
  longest single hop, so the stage D mode decision matters more here than anywhere else — and for a
  walk planned in another part of the city it may be the only leg that is not walked.
- **Stage A gets a proper seed.** Nearest-neighbour needs somewhere to start; without an explicit
  origin the local ordering has to pick an arbitrary marker. The origin removes that arbitrariness.
- **Planned departure is a forecast, not a live walk.** Until the user actually sets off, there is no
  position tracking and no pace measurement. "Start the walk" is the moment the clock re-anchors to
  now and the live loop begins — and if they leave from somewhere other than the planned origin,
  that is a re-plan.

## The route never writes archive state

**Walking to a point does not mark it visited.** Nothing in the routing feature ever writes
`visited` or `removed` — not arrival, not proximity, not finishing the walk. Those stay manual
actions, exactly as they are today.

The reason is that arriving somewhere is a fact about the user's position, not about the archive.
Standing at the coordinates can end in several different outcomes:

- the object is there and got photographed — **visited**;
- the object is gone — **removed**, which is the opposite of visited and would be destroyed by an
  auto-mark;
- it exists but could not be reached or shot — a locked courtyard, scaffolding, a parked lorry —
  which is neither;
- the user simply walked past without stopping.

Only the person standing there can tell these apart, and inferring "visited" from GPS proximity
would silently write the wrong one in at least three of the four cases. Position accuracy makes it
worse: the urban drift described in obstacle 5 means proximity is not even reliable evidence that
the user was at the point at all.

The useful inversion is that the route is an excellent place to *offer* those actions without
performing any of them. Arrival is the best moment in the whole app to log that something is gone —
the user is standing in front of the empty wall — so a stop row that surfaces **visited**, **gone**,
and **skip** at the right moment likely improves archive data quality rather than threatening it.
Offering is free; deciding stays with the user.

One consequence for the live loop: if the user marks a point removed or visited mid-walk, the route
in progress does not re-filter around it, for the same reason the scope toggle does not — see
[Route scope](#route-scope-all-markers-vs-unvisited-only). The write lands on the object; the walk
carries on unchanged and the next route picks the change up.

## Time on location

No per-object, per-category, or per-user duration data is stored anywhere. A stop is one to five
shots, so the model is a flat allowance:

- A single **minutes-per-stop** setting in the route panel, default in the 5–10 min range, applied
  uniformly to every stop.
- Optionally refined live: once a few stops are behind the user, their **observed** average time on
  location is known, and later stops can be estimated with that instead of the default. This is the
  combination of both approaches — a static allowance that becomes self-calibrating as evidence
  arrives.

This is strictly better than schema-backed durations for this use case: zero migration, zero cost,
nothing to maintain per object, and it converges on the truth for the individual user rather than
encoding one author's guess for everyone.

## Live re-estimation

**Decided: the order never changes on its own.** Once a route is computed, the sequence of stops is
fixed for the rest of the walk unless the user explicitly asks to re-plan. Everything below updates
*numbers* — arrival times, the cut-off, the polyline from where the user actually is — and nothing
below touches the sequence. This is a product rule, not an optimisation detail, and it is what makes
the live loop safe to run continuously.

Three tiers, only the last of which costs money:

| Tier | Trigger                                       | What it does                                                        | Order | Cost |
| ---- | --------------------------------------------- | ------------------------------------------------------------------- | ----- | ---- |
| 1    | Every position update                         | Rescale the current leg's remaining time from distance covered      | Kept  | Free |
| 2    | Every position update                         | Apply observed pace + observed dwell to all remaining legs and stops | Kept  | Free |
| 3    | Off-route beyond threshold, or a stop skipped | Refetch geometry and durations from the current position onward      | Kept  | Paid |
| —    | User asks to re-plan                          | Re-enter the pipeline for the remaining stops                        | **May change** | Paid |

Tier 1 and 2 are the important insight: **after the first plan is computed, we already hold the leg
durations and the polyline, so keeping the estimate honest is pure local arithmetic.** Remaining
time to the next marker scales with distance still to cover along its leg; every leg after that
scales by the pace multiplier we have measured; every stop after that uses observed dwell. The
sunset cut-off recomputes from those numbers on every tick, for free.

The pace multiplier is a bonus the static plan cannot offer: Google's walking durations assume a
generic pace, and someone stopping to photograph things moves differently. After two or three legs,
the ratio of predicted to actual leg time is a better model of *this* user than any API estimate,
and it improves every remaining number in the plan.

Tier 3 is worth keeping even under the fixed-order rule, because "the walking path from here is
wrong" is a different problem from "the sequence is wrong". If the user takes a different street or
cuts through a courtyard, the stored polyline no longer starts where they are and its remaining
duration is meaningless — so tier 3 refetches the path and durations **through the same stops in the
same order**, from the current position. It should fire on sustained distance from the polyline
beyond a threshold, and be rate-limited by a floor of a few minutes so a bad GPS patch cannot
trigger a burst.

**Re-estimating is not re-ordering.** A route that silently reshuffles while you are walking it is
worse than one that is honestly late: the user has already decided where they are going next, may
be able to see it, and a plan that keeps rewriting itself cannot be trusted or memorised.
Re-ordering is therefore an explicit action only ("re-plan the rest"), and it re-enters the pipeline
for the remaining stops alone — stops already behind you never come back into the sequence.

The one place this needs care is discoverability. Falling behind is exactly when re-ordering might
help, and the user cannot ask for something they do not know exists. So **offer** it at the moment
it becomes relevant — when the cut-off first moves, the panel says "3 stops won't fit" alongside a
"re-plan the rest" affordance — and then leave it alone. That satisfies both halves: nothing changes
unless asked, but the user is asked at the point where the answer matters.

## Recommended architecture

A five-stage pipeline, cheapest stage first, each stage independently useful:

```
walk set (transient client state)
    ↓  A. free local ordering — haversine nearest-neighbour + 2-opt
instant preview, offline fallback, and the source of stage B's destination
    ↓  B. one Convex action → Routes API computeRoutes (WALK, optimizeWaypointOrder)
fixed origin and destination, markers as intermediates; order + durations + polyline
    ↓  C. scheduling pass (pure, client-side)
departure from origin + per-stop allowance → arrival/departure per stop → twilight cut-off
    ↓  D. per-leg mode decision, only for legs over the walking threshold
extra computeRoutes in TRANSIT (with that leg's estimated departureTime) or DRIVE
    ↓  E. live loop while walking — position in, re-run C locally
free re-estimation every tick; paid refresh only on the tier-3 triggers
```

Stage C never calls anything. Stage D issues a handful of requests, not *n²*. Stage E is stage C
again, re-run from the current position with a measured pace and dwell instead of assumed ones —
which is why the live half adds almost no cost and no new API surface.

Note what stage E implies for stage B: since the estimate is continuously corrected during the
walk, **the initial plan does not need to be precise, only well-ordered.** That weakens the case
for expensive high-fidelity inputs even further than the cost model already does.

Suggested module layout, sized to the repo's 200-line file / 20-line function guidance:

| Module                                     | Responsibility                                        |
| ------------------------------------------ | ----------------------------------------------------- |
| `src/lib/state/walkSet.svelte.ts`          | The transient set + fill/remove verbs, mirrors `searchPointList` |
| `src/lib/state/routePlan.svelte.ts`        | The computed plan for the current set                  |
| `src/lib/services/route/solver.ts`         | Nearest-neighbour + 2-opt over a cost matrix (pure)    |
| `src/lib/services/route/schedule.ts`       | Forward simulation, arrival/departure, cut-off index   |
| `src/lib/services/route/sun.ts`            | Sunset / civil twilight from lat, lng, date            |
| `src/lib/services/route/progress.ts`       | Position → leg progress, observed pace and dwell (pure) |
| `src/lib/services/route/liveTracker.ts`    | `watchPosition` subscription, accuracy gate, tier-3 triggers |
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
- Stage E: **$0** per tick; a tier-3 refresh costs the same as stage B, and the rate-limit floor
  caps a long walk at a handful of them

So roughly **$0.03–0.08 per planned route**, and realistically under **$0.20 for an entire tracked
walk** including re-plans — against free monthly tiers of 10,000 Essentials / 5,000 Pro events. For
a personal archive app this is effectively free; it needs guarding only against a user hammering the
button and against a runaway live loop. A debounce, the tier-3 rate-limit floor, and a Google Cloud
daily quota cap cover all three.

The matrix-based alternative is ~$2–4 per plan and should only be reached for if true multimodal
optimisation turns out to be worth that.

## Alternatives considered

| Option                                                            | Verdict                                                                                                                              |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Google Route Optimization API** (`optimizeTours`)               | Rich modelling — visit durations, time windows, and penalty-based stop dropping, the last of which is exactly the sunset cut-off. But its strengths are mostly things we no longer need: durations are a flat constant here, and the cut-off is a local calculation. It is still single travel mode per vehicle, so it does not solve the multimodal part, and it adds per-shipment billing plus another API to enable. Worth revisiting only if stop counts exceed 25 or constraints get richer. |
| **Route Matrix + own solver**                                     | The only shape that supports genuine mixed-mode optimisation, but quadratic per-element billing makes it 100× more expensive per plan. Keep as a documented escape hatch.                                                                       |
| **Self-hosted OSRM / Valhalla / VROOM**                           | Free at any volume and Valhalla ships a TSP-style optimised-route endpoint. But the project is entirely serverless (Convex + SvelteKit on Node); this introduces a VM, OSM extracts, and tile rebuilds. Only justified if API cost ever becomes real, which at this scale it will not.                                          |
| **Hand off to Google Maps app with waypoints**                    | Nearly free and zero routing code, but it leaves the app, caps at ~10 waypoints in a URL, does not optimise order, and cannot express visit durations or the sunset cut-off. Fails the "without leaving the app" requirement outright. Still worth keeping as a "open in Google Maps" secondary action for navigation.               |

## Phased plan

**Phase 0 — product decisions.** Sunset vs civil twilight. "Optimal" means shortest total time or
most stops before the deadline. Whether taxi is offered at all (there is no fare API — we can show
time, not price). Default minutes per stop.

**Phase 1 — the walk set, no backend.** The set itself: a persistent tray showing what is in it and
how close it is to the 25 limit, "add to walk" on the details overlay, removal from the tray,
per-stop exclusion, and an origin picker reusing the existing search and geolocation. Stage A
ordering by haversine so the panel shows a plausible order and names an endpoint immediately. Ships
with zero API cost, no schema change, and no dependency on collections.

**Phase 1b — fill from a collection.** Whenever collections exist: "add to walk" on a collection,
with the all/unvisited option and its skipped-count line. Purely additive to phase 1, and the only
part of the feature that ever needed collections at all. A bulk select mode on the map belongs here
too, as a second convenience source.

**Phase 2 — real walking route.** Enable Routes API, add `src/convex/routing/`, wire Stage B, add
the polyline handle to `MapProvider`, render ordered badges on selected markers. Set a Google Cloud
daily quota before the first deploy.

**Phase 3 — time and sunset.** Departure-time control, the minutes-per-stop setting, `sun.ts`, the scheduling pass, and the cut-off UI: per-stop ETA, the
twilight line drawn in the leg list, "these 3 stops will not fit" with a one-tap trim — which is the
bulk case of the same exclusion mechanism phase 1 already built.

**Phase 4 — live tracking.** Switch position acquisition to `watchPosition` with high accuracy and
an accuracy gate, add `progress.ts` and `liveTracker.ts`, wire tiers 1–2, add cut-off hysteresis,
and handle the backgrounding gap. Mid-walk skipping lands here as well, since it needs the
re-anchoring and the provisional-estimate behaviour. Tier 3 and the explicit "re-plan the rest"
action land here too.
This phase is entirely local — no new API surface — and can ship before phase 5.

**Phase 5 — transport legs.** Walking threshold setting, Stage D per-leg transit/drive lookups,
mode icons and per-leg detail (line names, wait time) in the leg list, mandatory walking-beta and
transit attribution notices.

**Phase 6 — persistence and sharing.** Save a plan as our own record (marker IDs + order + settings,
no Google-derived content), reopen and recompute. Saving a walk set *as a collection* belongs here
too — the inverse of phase 1b, and equally cheap once collections exist, provided the two save
actions stay distinct. An in-progress walk should survive a reload — the plan plus
which stops are done, kept in `localStorage`.

**Phase 7 — optional escalation.** Re-solve rather than truncate at the deadline **at planning time
only**; Route Optimization API or matrices if the heuristic proves inadequate in real use.

Phases 1–4 are independently shippable and already deliver most of the value; phase 5 is the one
carrying the real technical risk.

## Open questions for the spike

1. Does `computeRoutes` accept `optimizeWaypointOrder: true` together with `travelMode: WALK`, and
   how good is the returned order on ~15 real archive points?
2. How accurate are Google's walking durations for the actual cities in the archive? The live pace
   multiplier now answers this automatically per user, so the open part is only whether the *first*
   plan is wrong enough to need a better default before any evidence exists.
3. Is transit coverage good enough in those cities for stage D to be worth building, or is
   walk-vs-taxi the only meaningful distinction? The approach leg from home is the first place to
   check, since it is usually the longest hop in the route.
4. How much route quality does the derived endpoint cost? Stage A fixes the destination before
   Google optimises anything, so compare its two candidate rules — last stop of the
   nearest-neighbour pass versus farthest marker from the origin — on real archive clusters.
5. How bad is GPS accuracy on the actual streets involved? This sets the off-route threshold and
   decides whether tier-3 refresh is reliable enough to trigger automatically or should stay manual.
6. Does the phone keep delivering positions with the screen off and the app backgrounded, on the
   devices actually used? If not, the live loop must resume gracefully rather than degrade.

## References

- [Set intermediate waypoints — Routes API](https://developers.google.com/maps/documentation/routes/intermed_waypoints)
- [Optimize the order of stops on your route — Routes API](https://developers.google.com/maps/documentation/routes/opt-way)
- [Get a transit route — Routes API](https://developers.google.com/maps/documentation/routes/transit-route)
- [Routes API usage and billing](https://developers.google.com/maps/documentation/routes/usage-and-billing)
- [Route Optimization API overview](https://developers.google.com/maps/documentation/route-optimization/overview)
- [Google Maps Platform service specific terms](https://cloud.google.com/maps-platform/terms/maps-service-terms)
