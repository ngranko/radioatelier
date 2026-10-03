# Images and cover photos

Object covers have two storage references: an uploaded image and an optional cropped preview. Image processing runs in the browser; Convex stores the files and their ownership records.

## Upload and attach

1. `objectForm/form.svelte` receives a JPEG, PNG, or WebP from the image input.
2. `resizeImage` processes it before upload.
3. The client obtains an upload URL through `images.generateUploadUrl`, posts the processed file, then calls `images.create` with the returned storage ID.
4. The resulting image ID and URLs enter local form state.
5. Saving the object attaches that image ID as `objects.coverId`.

Uploading and saving the object are separate operations. The stored original is the browser-processed image, not the full-resolution input file. Cancelling a form can leave an unattached image until cleanup.

CSV import uses the same resizer and image APIs after resolving its source URL or data URL. See [CSV import](import.md#images).

## Resize and orientation

The implementation starts at `src/lib/utils/imageResizer.ts`, with decoding, geometry, output policy, and transforms under `src/lib/utils/image/resizer/`.

| Default      | Behavior                                                                                       |
| ------------ | ---------------------------------------------------------------------------------------------- |
| Maximum edge | 1,024 pixels, preserving aspect ratio without upscaling                                        |
| Output type  | Preserve JPEG, PNG, or WebP; the generic resizer falls back to JPEG for other input types      |
| Quality      | 1, unless the caller supplies a value clamped to 0 to 1                                        |
| Orientation  | Use browser EXIF handling when available; apply EXIF transforms manually for fallback decoding |

The input UI and CSV resolver accept only JPEG, PNG, and WebP, even though the generic resizer has an output fallback. Callers can override `maxEdge`, `quality`, and `outputType`.

Decoding first tries `createImageBitmap` with image orientation applied, then a raw bitmap requiring manual orientation, then an HTML image fallback. Decoded bitmap resources are released after processing. `src/index.test.ts` covers avoiding double rotation and reading EXIF from a later APP1 segment.

## Crop a preview

`src/lib/components/input/imageUpload/cropDialog.svelte` crops the stored original at a 2:1 aspect ratio, with zoom from 1 to 3. It renders the selected pixels to a canvas and encodes a JPEG at quality 0.9.

The crop uploads a new file and calls `images.updatePreview`. This updates the image record immediately and deletes the previous preview file if it differs. Cropping is not deferred until the object form is saved, so discarding form changes does not undo an already saved crop.

The image field displays `previewUrl` when available and otherwise the original URL. Opening the image viewer uses the original URL. Removing a cover clears the form's reference; saving the form detaches it from the object.

## Ownership and cleanup

`src/convex/images.ts` requires a current app user for upload URLs and image creation. New rows store `createdById`. Preview changes require that uploader ID to match the current user; knowing an image ID is insufficient.

Old image rows may lack an owner. They reject preview updates until attributed through the [image-owner migration](maintenance.md#available-migrations) or a deliberate manual correction.

`storage.sweepUnusedImages` runs daily at 00:00 UTC. It deletes image rows unused by object covers, then hands off to `storage.sweepUnusedFiles`, which deletes storage files no image references. Both page through their table in batches and skip anything younger than a day, so an upload waiting in an unsaved form survives. Removing one object's cover does not collect an image still referenced by another object.

See [Object backend](object-backend.md) for record relationships and [Maintenance](maintenance.md) for scheduled jobs.
