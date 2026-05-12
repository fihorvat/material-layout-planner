# T34 — Background image import & calibration

- **Milestone**: M9
- **Depends on**: T06
- **Status**: todo

## Goal

Let users import an image, calibrate its scale by clicking two points and entering the real distance, then lock the image as a tracing reference (plan §32).

## Files

```
src/features/drawingTools/CalibrateImageTool.tsx
src/features/editor/canvas/BackgroundImageLayer.tsx
src/features/backgroundImage/ImportImageDialog.tsx
src/features/backgroundImage/BackgroundImageProperties.tsx
src/domain/backgroundImage/calibrateImage.ts
src/domain/backgroundImage/__tests__/calibrateImage.test.ts
src/domain/commands/builtin/backgroundImageCommands.ts
```

## Data model

`BackgroundImageRef` (defined in T02):

```ts
{
  id: string;
  blobKey: string;             // IndexedDB blob key
  dataUrl?: string;            // thumbnail fallback only
  position: Point2D;           // top-left in world mm
  rotationDeg: number;
  scaleMmPerPx: number;        // calibration result
  opacity01: number;
  locked: boolean;
  visible: boolean;
  calibration?: { a: Point2D; b: Point2D; realDistanceMm: number };  // last calibration used
  pixelWidth: number;
  pixelHeight: number;
}
```

## Import flow

1. User clicks toolbar "Import image" or activates an Import-image command from the File menu.
2. `ImportImageDialog` opens with a file input (`accept="image/png,image/jpeg,image/webp"`).
3. On selection:
   - Read file as `Blob`.
   - Generate a thumbnail via canvas API (max 200 × 200, JPEG quality 0.7) for `dataUrl`.
   - Store `Blob` under `bg:${projectId}:${newId}` via `projectRepository.putBlob` (T04).
   - Build a `BackgroundImageRef` with `position: { x: 0, y: 0 }`, `rotationDeg: 0`, default scale 1 mm/px (placeholder until calibration), `opacity01: 1`, `locked: false`, `visible: true`.
   - Dispatch `addBackgroundImageCommand({ ref })`.

## Calibration tool

Activated automatically after import or via "Calibrate" button in properties panel.

Flow:

1. Click point A on the image (snap to image pixels disabled; world position recorded).
2. Click point B.
3. Floating prompt: "Enter real distance between the points". Field uses `parseLength`.
4. Compute new scale: `scaleMmPerPx = (newRealMm) / pixelDistance`. **But** since we operate in mm world coords, calibration directly adjusts the image's `scaleMmPerPx` so that the world-distance between A and B equals the entered value. Implementation:
   - Current world distance between A and B is computed from current scale.
   - `factor = enteredMm / currentWorldMm`.
   - Multiply image's effective scale by `factor`: `newScale = oldScale * factor`.
   - Optionally re-center: keep the midpoint of A and B stationary.
5. Dispatch `calibrateBackgroundImageCommand({ id, calibration, newScale, repositionDelta })`.

## Properties panel

`BackgroundImageProperties`:

- Opacity slider (0..1)
- Lock toggle
- Visible toggle
- Rotation input
- Position X / Y (read-only display; user moves via Select tool when unlocked)
- Recalibrate button
- Scale display (`1 px = 0.81 mm` etc.)
- Replace image button
- Remove image button

## Renderer

`BackgroundImageLayer`:

- For each `BackgroundImageRef`, load the Blob (cached) and render as a Konva `Image` at world position with computed pixel-to-mm scaling and rotation.
- Apply `opacity01`.
- When `locked === true`, ignore pointer events.

Loading strategy:

- On project load, prefetch blobs via `repository.getBlob(blobKey)` and create `HTMLImageElement` from `URL.createObjectURL(blob)`.
- Cache in a module-level Map keyed by blobKey; release on project unload.

## Commands

```ts
addBackgroundImageCommand({ ref, blobKey, blob });      // applies blob put as part of dispatch (blob storage side-effect)
updateBackgroundImageCommand({ id, patch });
calibrateBackgroundImageCommand({ id, scaleMmPerPx, position, calibration });
removeBackgroundImageCommand({ id });                   // cleans up blob too
```

Side-effecting commands (blob storage) must keep `apply` synchronous from the store's perspective, but they enqueue the blob write to the repository asynchronously. If the write fails, surface a console error and a warning (`backgroundImage.blobWriteFailed`).

## Implementation steps

1. Build `calibrateImage.ts` + tests for scale-factor math.
2. Build commands; integrate blob lifecycle with `projectRepository`.
3. Build `ImportImageDialog`.
4. Build `BackgroundImageLayer` and replace the placeholder in `LayersRoot`.
5. Build `CalibrateImageTool` (`activeTool === 'calibrateImage'`).
6. Build `BackgroundImageProperties`.

## Decisions

- **Blobs stored in IndexedDB**, not as data URLs in the project, to keep JSON exports lean and avoid bloating localStorage. JSON export includes the `blobKey`; importing on another machine produces a missing-image placeholder until the user re-imports the binary. Document this clearly in `BackgroundImageRef`.
- **Calibration adjusts `scaleMmPerPx`, not pixel data**. The image stays unchanged; world coordinates absorb the calibration.
- **Locked images skip pointer events** entirely so the user can draw over them confidently.

## Open questions

_(none)_

## Acceptance criteria

- [ ] User can import a PNG/JPEG/WebP file.
- [ ] Two-point calibration with a typed distance sets the right scale.
- [ ] After calibration, drawing a line between the same two points yields the expected length.
- [ ] Image can be repositioned and rotated when unlocked.
- [ ] Locking prevents accidental moves.
- [ ] Removing the image cleans up the blob.
- [ ] JSON export omits binary; reload shows placeholder.
- [ ] Tests pass.

## Verification

```
npm test -- src/domain/backgroundImage
npm run dev   # manual import + calibrate + draw
```

## Progress Log

_(append entries here)_
