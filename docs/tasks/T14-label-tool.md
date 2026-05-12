# T14 — Label tool

- **Milestone**: M2
- **Depends on**: T09
- **Status**: todo

## Goal

Allow users to place free-floating or anchored text labels on the canvas. Labels appear on the `labels` layer and are selectable/movable/editable via the Select tool.

## Anchors (plan §9.7)

- `free` — fixed position in world coords.
- `surface` — anchored to a surface; label moves with surface.
- `materialPiece` — anchored to a piece (rendered by T25's renderer; tool can still create them but commit guarded if no piece exists).
- `edge` — anchored to a surface edge midpoint.
- `opening` — anchored to an opening centroid.

For each anchor type other than `free`, `anchorId` is required; position is stored as the offset relative to the anchor's reference point.

## Files

```
src/features/drawingTools/LabelTool.tsx
src/features/drawingTools/label/useLabelDraw.ts
src/features/drawingTools/label/LabelEditor.tsx
src/features/drawingTools/label/LabelRenderer.tsx
src/features/drawingTools/label/computeAnchorPosition.ts
src/features/drawingTools/label/__tests__/computeAnchorPosition.test.ts
```

## Tool flow

1. Activate Label tool. Properties panel shows the anchor type selector. Default: `free`.
2. For `free`: click on canvas to place; an inline DOM input appears at the click location for typing the label text. Enter commits, Esc cancels.
3. For anchored types: hovering shows which target will be picked (highlight). Click on the target, then DOM input appears for text.

## Commit

Build `LabelEntity` (T02):

```ts
{ id, text, anchorType, anchorId?, position, rotationDeg: 0, style: defaultTextStyle() }
```

For anchored labels, `position` stores the offset from the anchor reference point in mm. For `free`, `position` is the absolute world location.

Dispatch `addLabelCommand({ label })`.

## Renderer

`LabelRenderer` mounted inside `LabelsLayer`. For each `LabelEntity`:

- Compute world position via `computeAnchorPosition(label, project)`:
  - `free` → label.position
  - `surface` → surface centroid + label.position
  - `edge` → edge midpoint + label.position
  - `opening` → opening centroid + label.position
  - `materialPiece` → piece label position from `MaterialPiece.labelPosition` + label.position
- Render `<Text>` with the style (size, color, optional bold/italic).
- Text background: optional translucent white rectangle behind text for readability (style.background flag).

## Editing

Double-clicking a label via the Select tool reopens the inline DOM editor for the text.

## Commands needed

- `addLabelCommand`, `updateLabelCommand`, `deleteLabelCommand` — add to T08 built-ins.

## Implementation steps

1. Build `computeAnchorPosition` + tests.
2. Build `LabelEditor` (DOM input portal).
3. Build `LabelRenderer` and mount in `LabelsLayer`.
4. Build `useLabelDraw` and `LabelTool`.
5. Tests for anchor resolution and add/update/delete cycle.

## Decisions

- **Anchored labels store offsets, not absolute positions**: when the anchor moves, label follows. This matches user expectation from CAD tools.
- **Rotation is 0 by default**; user can edit via properties panel after creation.

## Open questions

_(none)_

## Acceptance criteria

- [ ] Free labels can be placed and edited.
- [ ] Surface/edge/opening labels follow their anchor when the anchor moves.
- [ ] Inline editor commits on Enter, cancels on Esc.
- [ ] Label add/update/delete is undoable.
- [ ] Tests pass.

## Verification

```
npm test -- src/features/drawingTools/label
```

## Progress Log

_(append entries here)_
