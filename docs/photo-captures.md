# Photo captures

A photo capture adds an Object from a photo taken on the spot. The browser sends the photo and where it was taken; a Convex action asks a vision model for the title, category and tags; the result is a private Object pending review. The tap-map → "Добавить" flow is unaffected.

## Capture

`photoCapture/photoCaptureButton.svelte` is a camera chip at the bottom left of the map, shown only where the main pointer is coarse (`pointer-coarse:`), so phones and tablets get it and laptops don't. It opens the camera directly through `capture="environment"`; there is no gallery path.

Before opening the camera the chip checks the hourly limit (see [Limits](#limits-and-keys)). A photo taken through the browser's camera input is not saved to the camera roll, so a photo that cannot be sent would be lost.

`services/photoCapture/submitCapture.ts` then runs the capture:

1. **Location.** EXIF GPS first (`utils/image/exifGps.ts`, read from the original file because resizing re-encodes it without metadata). Then the watched device position, if the photo is under ten minutes old and the position under two (`readRecentPosition` in `services/map/geolocation.ts`; reusing the watch avoids an iOS permission prompt). Otherwise the map shows "Нажмите на карту, где сделано фото" and the next map tap places the photo; ✕ drops it.
2. **Resize and address.** The photo goes through the usual resizer, and the address comes from `locations.getAddress`. A failed lookup leaves the address empty.
3. **Send.** `uploadImage`, then `photoCaptures.create`. The chip spins until this finishes and a toast says "Фото отправлено на разбор".

If sending fails, the photo and its place are stored in IndexedDB (`unsentCaptures.ts`, database `photoCaptures`, store `unsent`). The review page lists them as "Не загружено" with "Повторить" and ✕. Nothing retries them automatically.

## Analysis

`photoCaptures.create` checks that the caller uploaded the image and that no gallery or other capture holds it, charges the limit, stores a `photoCaptures` row (`processing`, attempt 1) and schedules `photoCaptureAnalysis.analyze`.

The action sends the photo inline to OpenRouter's chat completions endpoint with a strict JSON schema (`helpers/photoCaptures/`):

| Part           | Rule                                                                                                                                                                    |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Title          | The text on the object exactly as written: casing, language and alphabet kept, lines joined with a space. A short Russian description only when the object has no text. |
| Category       | One name from an enum of the categories not being deleted                                                                                                               |
| Tags           | Names from an enum of the tags not being deleted; may be empty                                                                                                          |
| Style examples | The 30 latest public titles. Private titles never leave the archive.                                                                                                    |
| Context        | The capture's address                                                                                                                                                   |

Names are mapped back to ids; an unknown category fails the analysis and unknown tags are dropped. Success creates the Object through the writer with `isPublic: false`, `isPendingReview: true`, the photo as its only image, and the owner's visited flag set; Notion sync follows the owner's setting as for any create. The capture row is then deleted.

A failure marks the row `failed` with a reason code: `key_rejected`, `no_credits`, `model_failed`, `invalid_response` or `unexpected`. The first two are shown to the owner because only the owner can fix them. "Повторить" (`photoCaptures.retry`) is free and allowed up to three attempts in total. "Заполнить вручную" opens `/point?capture=<id>` with the photo, address and visited flag filled in; saving it removes the capture, since `objects.create` releases any capture of the owner's holding an attached image. ✕ (`photoCaptures.dismiss`) deletes the row and leaves the image to the daily sweep.

## Pending review

`objects.isPendingReview` is mirrored on `markers`. Details and the marker list report it only to the owner, so nobody else sees the notice or the dot. The owner sees an amber dot on the marker, "Создано по фото — проверьте данные" with "Подтвердить" in details, a count on the "На проверке" menu item and a dot on the avatar.

Approval clears the flag on the Object and its marker. It happens through `objects.approve` (the details notice and the list's check button) or through any owner save of the edit form, which reports `wasApproved` back to the save action.

`/review` lists captures in progress, unsent photos and pending Objects (`pendingReview.list`), then the key section. `PhotoCaptureFeedback` follows the same live lists and toasts "Добавлено: «…»" for each new pending Object and "Не удалось распознать фото" for each new failure, because analyses finish after the browser has moved on.

## Limits and keys

Without a key, each account gets a token bucket of 5 captures per hour (`helpers/photoCaptures/quota.ts`), charged when the capture is created. `photoCaptures.getQuota` returns the stored level and its timestamp; the browser projects the refill to the present (`utils/photoCaptureQuota.ts`), since a cached query does not rerun as time passes.

An account can connect its own OpenRouter key on the review page. `openRouterKeys.connect` checks it against OpenRouter's key endpoint and stores it in `userOpenRouterKeys`, which only internal functions read. With a key, captures skip the bucket and the analysis runs on that key. The page shows only that a key is connected, never the key.

See [Environment](environment.md#openrouter) for the archive key and model.
