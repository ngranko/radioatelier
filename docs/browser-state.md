# Browser state and app shell

The root layout initializes the Convex client, wraps pages in Clerk and the authentication bridge, initializes theme state on mount, and hosts the shared toast UI and portal. The app layout adds the map, search, markers, and controls; the full-list layout supplies the archive catalog and details panel.

Entry points are `src/routes/+layout.svelte`, `src/routes/(app)/+layout.svelte`, and `src/routes/(app)/(fullList)/+layout.svelte`.

## Persistence boundaries

| State                                  | Storage                                        | Lifetime                                     |
| -------------------------------------- | ---------------------------------------------- | -------------------------------------------- |
| Category styles, private tags, visits  | Convex, scoped to the user                     | Across devices and sessions                  |
| Theme choice                           | `localStorage.theme`                           | Same browser, including after sign-out       |
| Map viewport                           | `localStorage.lastCenter`                      | Same browser; cleared by the sign-out dialog |
| Last device position                   | `localStorage.lastPosition`                    | Same browser; cleared by the sign-out dialog |
| First-run hint dismissal               | `localStorage.firstRunHintDismissed`           | Same browser, including after sign-out       |
| Search query and center                | URL `q`, `lat`, and `lng`, plus reactive state | Restored from a valid search URL             |
| Draft position and unsaved form values | Reactive state                                 | No durable draft storage                     |

The local-storage preferences are not keyed by account. Sign-out clears map location keys but leaves theme and hint dismissal. Category styling remains an account preference in Convex; it is unrelated to the browser theme.

## Theme

`src/app.html` applies the initial dark class before hydration using the saved preference and system color scheme. `src/lib/state/theme.svelte.ts` owns `light`, `dark`, and `system` preferences, resolves the active theme, and updates the root class.

System color changes update the app only while the preference is `system`. The theme switcher writes local storage, and the toast UI reads the resolved theme. Google Maps receives its color scheme during provider initialization; the provider does not reinitialize the map when the app preference changes.

Theme tokens and component styling live in `src/styles/app.css`. The app shell declares Russian language and shared social-preview metadata in `src/app.html`.

## Initial location and live tracking

`src/lib/services/map/geolocation.ts` chooses the initial center in this order:

1. Saved `lastCenter`, including zoom when available.
2. Saved `lastPosition`.
3. Google Geolocation API using the browser Maps key.
4. Coordinates `0,0` if the Google request fails or has no location.

Separately, the map starts one `navigator.geolocation.watchPosition` subscription, with high accuracy disabled and a five-second timeout. Successful updates store coordinates with `isCurrent: true`; errors retain the last coordinates and mark them stale. Map teardown clears the watch.

`locationMarker.svelte` reads that stored position every second and changes its stale styling. The compass uses device orientation when enabled. The position button uses `lastPosition`, while map idle saves `lastCenter`. See [Map architecture](map-architecture.md#controls-and-persisted-state) for controls.

## URL and transient state

`src/lib/state/search.svelte.ts` restores full results only when the URL has a nonempty query and valid latitude and longitude. `getActiveSearchUrl` supplies the return location after object interactions. Clearing search also clears search pins and the remembered search area.

`createDraftState` stores only the temporary point position. The details overlay and form hold the remaining unsaved values. Reloading is not a draft recovery mechanism; it reconstructs the selected route's data.

## Keyboard and motion

`src/lib/utils/escapeClose.ts` dispatches Escape to the highest-priority active registered handler. It defers while a dialog, alert dialog, popover, dropdown, or select is open, allowing that floating layer to handle dismissal first.

`src/lib/utils/motion.ts` makes shared side-panel transitions instantaneous under reduced-motion preferences. Gesture haptics use a 12 ms vibration only when `navigator.vibrate` exists. These helpers do not imply that every animation uses reduced-motion handling.

The app shell also suppresses page-level pinch and double-tap zoom; map gestures are implemented separately. See [Map architecture](map-architecture.md#focus-and-gestures) and [Object details overlay](object-details-overlay.md).
