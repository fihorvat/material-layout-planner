# 2D Material Layout Planner — Full Application Specification

## 1. Document Purpose

This document defines the full product and technical specification for a local browser-based React application used to draw measured 2D surfaces, assign rectangular materials, define placement patterns, calculate physical overlaps, generate material layouts, produce cut lists, and export complete PDF documentation for installation.

Background needs to have grid lines for better accuracy (can be toggled on/off in settings).

The application should be general and abstract. It should not be limited to stone, BBQs, fireplaces, tiles, or any single construction use case.

The core concept is:

> A 2D material layout planner for measured surfaces.

The application can be used for:

- BBQ/fireplace cladding
- Wall cladding
- Ceramic tile layouts
- Porcelain panels
- Brick slips
- Wood panels
- Facade panels
- Concrete panels
- Metal sheets
- Decorative boards
- Any rectangular material unit installed on a 2D surface

---

## 2. Product Summary

The application is a **local browser-only React application** that allows the user to:

1. Draw accurate 2D geometry using real dimensions.
2. Create named surfaces from polygons, rectangles, and openings.
3. Connect multiple 2D surfaces together.
4. Define a material with width, height, thickness, and joint/gap width.
5. Assign one material to one surface.
6. Define placement pattern, orientation, direction, and offsets.
7. Allow physical material overlap across selected edges.
8. Display overlap areas with reduced opacity.
9. Optimize layout according to user-selected priorities.
10. Manually adjust horizontal and vertical offset by mouse or numeric input.
11. Display dimensions on every line, surface, and material piece.
12. Generate a material cut list.
13. Generate cutting diagrams and installation instructions.
14. Export a PDF containing final appearance, technical drawing, material layout, cut list, and instructions.
15. Save and load projects locally in the browser.
16. Import/export projects as JSON files.
17. Import a background image, calibrate it, and trace over it.

---

## 3. Core Principle

The most important architectural rule:

```txt
The canvas is only a visual editor.
The source of truth is the measured project data model.
```

The project must not be stored as pixels. It must be stored as structured measured data:

```txt
Points
Lines
Rectangles
Polygons
Openings
Surfaces
Surface connections
Edge rules
Materials
Placement patterns
Material pieces
Dimensions
Labels
Styles
PDF settings
```

This is required so the application can generate accurate dimensions, cut lists, overlap information, optimization results, and PDF documentation.

---

## 4. Terminology

The application must use abstract terminology.

### 4.1 Preferred Terms

| Term | Meaning |
|---|---|
| Project | Complete drawing and layout file. |
| Surface | A named 2D area where material can be installed. |
| Material | The installable product, such as stone, tile, wood, panel, metal sheet, etc. |
| Material unit | One full uncut piece of material. |
| Material piece | One placed piece, either full, cut, irregular, or overlapping. |
| Joint / gap | Space between material pieces. This replaces the more specific word grout. |
| Placement pattern | Rule that defines how material units repeat across a surface. |
| Material layout | Result of placing material pieces on a surface. |
| Physical overlap | Part of a material piece that extends beyond a surface edge. |
| Visible area | Part of the material visible on the target surface. |
| Physical area | Full real material area, including overlap. |
| Cut list | List of material pieces that must be cut or installed. |
| Cutting diagram | Diagram showing how pieces are obtained from full material units. |

### 4.2 Terms To Avoid In Core Logic

Avoid hardcoding these terms in data models, component names, and internal logic:

```txt
Stone
Tile
Slab
Brick
Grout-only
BBQ-only terminology
```

The user can still create a material named `Stone 600 × 300 × 20 mm`, but the application logic should only treat it as a material.

---

## 5. Confirmed Requirements

### 5.1 Multiple Connected 2D Surfaces

The application must support more than one 2D surface. Surfaces can be connected to each other through edges.

Example:

```txt
Front face connected to left side
Front face connected to right side
Front face connected to top surface
Upper band connected to side return
```

This should not be a full 3D modeling tool. It should remain a 2D editor with connection metadata between surfaces.

---

### 5.2 Physical Overlap

The user must be able to define how much a material piece can physically go over a selected edge.

Example:

```txt
Overlap: 2.3 cm = 23 mm
```

The overlap must be real physical material, not just a visual extension. It must be counted in:

- material piece size
- cut list
- material quantity
- waste calculation
- PDF notes

Overlap must be displayed semi-transparently so the user can see that it extends beyond the surface boundary.

---

### 5.3 One Material Per Surface

Each surface can have only one assigned material.

If a wall or object uses multiple material types, the user must split the wall/object into multiple surfaces.

Example:

```txt
Wall A uses material 1 on the bottom and material 2 on the top.
The wall must be split into Surface A1 and Surface A2.
```

---

### 5.4 Material Thickness

Material thickness must be included.

The material is not only:

```txt
600 × 300 mm
```

It is:

```txt
600 × 300 × thickness mm
```

Example:

```txt
600 × 300 × 20 mm
```

Thickness affects:

- material labels
- cut list
- corner notes
- overlap/corner connection details
- PDF technical notes
- exposed edge warnings

---

### 5.5 PDF Content

The PDF must contain:

1. A final image showing how the result should look.
2. A technical drawing with dimensions.
3. A material layout drawing.
4. A material cut list.
5. Cutting diagrams.
6. Instructions for the installer/mason.

---

### 5.6 Local Browser-Only Application

The application must work locally in the browser.

Requirements:

```txt
No server required
No login required
No cloud database required
No account system required
No online synchronization required
```

Projects should be saved locally using browser storage and exportable as JSON.

---

### 5.7 Optimization Options And Manual Offset

The UI must allow the user to choose optimization priorities.

The user must also be able to manually adjust placement pattern offset in two ways:

1. By dragging the pattern on the canvas with the mouse.
2. By entering exact horizontal and vertical offset values in the UI.

Offset values:

```txt
Offset X
Offset Y
```

---

## 6. User Roles

### 6.1 Primary User

A person planning material installation on measured surfaces.

This can be:

- homeowner
- mason
- installer
- designer
- contractor
- fabricator
- DIY user

### 6.2 User Goals

The user wants to:

- draw the object accurately
- define surfaces and openings
- assign material
- preview the material layout
- keep the layout symmetrical where needed
- reduce waste
- avoid ugly small pieces
- understand where physical overlap occurs
- print or export clear instructions
- give a PDF to the person doing the work

---

## 7. Main User Workflows

## 7.1 Create A Project From Scratch

```txt
1. Create new project.
2. Set project name.
3. Set units to millimeters.
4. Draw outer geometry using line, rectangle, or polygon tools.
5. Draw openings or holes.
6. Convert geometry into named surfaces.
7. Define material.
8. Assign material to surfaces.
9. Define placement pattern.
10. Set joint/gap width.
11. Set edge overlap rules.
12. Generate material layout.
13. Adjust offset manually if needed.
14. Review cut list and warnings.
15. Export PDF.
```

---

## 7.2 Create A Project From An Imported Image

```txt
1. Create new project.
2. Import a background image.
3. Select two known points on the image.
4. Enter real distance between those points.
5. The app calibrates the image scale.
6. Lock the image layer.
7. Draw measured geometry over the image.
8. Continue with surface creation and material layout.
```

---

## 7.3 Use Multiple Connected Surfaces

```txt
1. Draw Surface A.
2. Draw Surface B.
3. Select an edge of Surface A.
4. Select an edge of Surface B.
5. Create surface connection.
6. Define connection type.
7. Define angle, usually 90°.
8. Define overlap behavior.
9. Define thickness behavior.
10. Generate layout.
```

---

## 7.4 Use Physical Overlap

```txt
1. Select a surface.
2. Select one edge.
3. Set edge rule to Physical Overlap.
4. Enter maximum overlap, for example 23 mm.
5. Set overlap opacity, for example 25%.
6. Generate layout.
7. App displays the visible area normally and overlap area semi-transparently.
8. Cut list includes the overlap size.
```

---

## 7.5 Manual Pattern Offset

```txt
1. Select a surface.
2. Open placement pattern panel.
3. Either drag the pattern origin handle on the canvas or enter Offset X and Offset Y.
4. Layout updates live.
5. User can lock manual offset before optimization.
```

---

## 8. Application Screens

## 8.1 Project Dashboard

The dashboard should include:

```txt
New project
Open saved local project
Duplicate project
Delete project
Rename project
Import project JSON
Export project JSON
Recent projects
```

Project list item should show:

```txt
Project name
Last modified date
Number of surfaces
Number of materials
Optional thumbnail
```

---

## 8.2 Main Editor

Suggested layout:

```txt
┌──────────────────────────────────────────────────────────────┐
│ Top toolbar: file, undo, redo, zoom, grid, snap, export PDF   │
├──────────────┬─────────────────────────────┬─────────────────┤
│ Left tools   │ Main 2D canvas              │ Properties      │
│              │                             │ panel           │
│ Select       │ Drawing geometry            │ Selected object │
│ Line         │ Surfaces                    │ Dimensions      │
│ Rectangle    │ Openings                    │ Style           │
│ Polygon      │ Material layout             │ Material        │
│ Opening      │ Dimensions                  │ Pattern         │
│ Surface      │ Labels                      │ Edge rules      │
│ Dimension    │ Overlap zones               │ Connections     │
│ Label        │                             │                 │
├──────────────┴─────────────────────────────┴─────────────────┤
│ Bottom panel: surfaces, materials, layouts, cut list, warnings │
└──────────────────────────────────────────────────────────────┘
```

---

## 8.3 PDF Export Dialog

The PDF export dialog should allow the user to configure:

```txt
Paper size: A4 / A3
Orientation: portrait / landscape
Scale: auto / 1:5 / 1:10 / 1:20 / custom
Include final appearance
Include technical drawing
Include material layout
Include dimensions
Include surface names
Include material piece IDs
Include piece dimensions
Include overlap zones
Include cut list
Include cutting diagrams
Include installation instructions
```

---

## 9. Drawing Tools

## 9.1 Select Tool

The select tool allows the user to:

```txt
Select one object
Select multiple objects
Move selected object
Move individual points
Resize objects
Rotate objects
Delete objects
Duplicate objects
Lock/unlock objects
Hide/show objects
Edit object properties
```

Selectable objects:

```txt
Point
Line
Rectangle
Polygon
Surface
Opening
Dimension
Label
Material piece
Pattern origin handle
Overlap area
Background image
```

---

## 9.2 Line Tool

Every line must support exact numeric input.

Supported modes:

```txt
Start point + end point
Start point + length + angle
Start point + horizontal length
Start point + vertical length
Connect two existing points
Snap from existing point
```

Line creation flow:

```txt
1. Select Line tool.
2. Click first point.
3. Move cursor in approximate direction.
4. Enter length, for example 2000 mm.
5. Enter angle, for example 0°.
6. Press Enter.
7. The measured line is created.
```

Line properties:

```ts
type LineEntity = {
  id: string;
  type: "line";
  start: Point2D;
  end: Point2D;
  name?: string;
  showDimension: boolean;
  style: DrawingStyle;
};
```

Displayed information:

```txt
Length
Angle
Optional name
Endpoint markers
```

---

## 9.3 Rectangle Tool

Supported modes:

```txt
Click + width + height
Click + drag + numeric correction
Center point + width + height
Two opposite corners
```

Rectangle properties:

```ts
type RectangleEntity = {
  id: string;
  type: "rectangle";
  origin: Point2D;
  widthMm: number;
  heightMm: number;
  rotationDeg: number;
  name?: string;
  showDimensions: boolean;
  style: DrawingStyle;
};
```

A rectangle can be converted into:

```txt
Surface
Opening
Polygon
Construction geometry
```

---

## 9.4 Polygon Tool

The polygon tool is required for irregular surfaces.

Behavior:

```txt
Click to add points
Snap to existing points
Display segment length while drawing
Allow numeric entry for each segment
Press Enter or double-click to close polygon
Validate polygon after closing
Warn if self-intersecting
```

Polygon properties:

```ts
type PolygonEntity = {
  id: string;
  type: "polygon";
  points: Point2D[];
  name?: string;
  showSegmentDimensions: boolean;
  showArea: boolean;
  style: DrawingStyle;
};
```

Each polygon side should show its true dimension when dimension display is enabled.

---

## 9.5 Opening / Hole Tool

Openings are areas removed from surfaces.

Examples:

```txt
Firebox opening
Storage opening
Vent opening
Window opening
Door opening
Any empty interior polygon
```

Opening types:

```txt
Rectangular opening
Polygon opening
Converted selected shape
```

Opening properties:

```ts
type Opening = {
  id: string;
  parentSurfaceId: string;
  boundary: Point2D[];
  name?: string;
  showDimensions: boolean;
  style: DrawingStyle;
};
```

---

## 9.6 Dimension Tool

Supported dimension types:

```txt
Horizontal dimension
Vertical dimension
Aligned dimension
Distance between two points
Distance between two parallel lines
Angle dimension
Area label
```

Dimension entity:

```ts
type DimensionEntity = {
  id: string;
  type: "dimension";
  dimensionType: "horizontal" | "vertical" | "aligned" | "angle" | "area";
  references: DimensionReference[];
  textOverride?: string;
  offsetMm: number;
  style: DimensionStyle;
};
```

Dimensions should update automatically when referenced geometry changes.

---

## 9.7 Label Tool

Labels can be attached to:

```txt
Surface
Material piece
Connection
Edge
Opening
Free point
```

Label properties:

```ts
type LabelEntity = {
  id: string;
  text: string;
  anchorType: "free" | "surface" | "materialPiece" | "edge" | "opening";
  anchorId?: string;
  position: Point2D;
  rotationDeg: number;
  style: TextStyle;
};
```

---

## 10. Measurement System

All internal calculations must use millimeters.

Supported user input:

| Input | Internal value |
|---:|---:|
| `600` | `600 mm` |
| `600 mm` | `600 mm` |
| `60 cm` | `600 mm` |
| `0.6 m` | `600 mm` |
| `2.3 cm` | `23 mm` |
| `3 mm` | `3 mm` |

The unit parser should support:

```txt
mm
cm
m
plain number treated as mm
```

All exported dimensions should be displayed in user-selected format, but internally stay in millimeters.

---

## 11. Surfaces

A surface is a named measured 2D area where material can be installed.

Examples:

```txt
Front face
Left side
Right side
Top band
Bottom band
Area around opening
Facade section A
Wall section B
```

Surface model:

```ts
type Surface = {
  id: string;
  name: string;

  outerBoundary: Point2D[];
  holes: Point2D[][];

  materialId: string | null;
  placementPatternId: string | null;

  edgeRules: EdgeRule[];
  connections: SurfaceConnectionRef[];

  showName: boolean;
  showDimensions: boolean;
  showArea: boolean;

  style: SurfaceStyle;
};
```

Surface requirements:

```txt
Must have a valid closed outer boundary
May contain zero or more holes
Can be connected to other surfaces
Can have exactly one assigned material
Can have one placement pattern
Can have per-edge rules
Can show name, dimensions, and area
```

---

## 12. Surface Splitting

Because each surface can use only one material, the application must support splitting surfaces.

Split methods:

```txt
Split by line
Split by rectangle
Split by polygon
Split at exact dimension
Split by selected construction line
```

Workflow:

```txt
1. Select surface.
2. Select Split Surface tool.
3. Draw or select split line.
4. App creates two or more new surfaces.
5. User names each new surface.
6. User assigns material and pattern to each surface.
```

After splitting, inherited properties should include:

```txt
Style
Dimension visibility
Default material, optional
Default pattern, optional
```

---

## 13. Multiple Connected 2D Surfaces

The app must allow surfaces to be connected by edges.

Connection model:

```ts
type SurfaceConnection = {
  id: string;

  surfaceAId: string;
  edgeAId: string;

  surfaceBId: string;
  edgeBId: string;

  connectionType:
    | "outsideCorner"
    | "insideCorner"
    | "flatContinuation"
    | "buttJoint"
    | "custom";

  angleDeg: number;

  jointAtConnectionMm: number;

  allowPatternContinuation: boolean;
  allowPhysicalOverlap: boolean;

  defaultOverlapMm: number;
  overlapOpacity: number;

  thicknessMode:
    | "ignoreThickness"
    | "showThicknessOnly"
    | "compensateCoveredEdge"
    | "customAllowance";
};
```

Connection workflow:

```txt
1. Select surface A.
2. Select edge of surface A.
3. Select surface B.
4. Select edge of surface B.
5. Choose connection type.
6. Enter angle.
7. Enable or disable physical overlap.
8. Set overlap amount.
9. Choose thickness behavior.
10. Optionally align placement pattern across the connected surfaces.
```

Supported connection types:

| Type | Meaning |
|---|---|
| outsideCorner | Two surfaces meet at an outside corner. |
| insideCorner | Two surfaces meet at an inside corner. |
| flatContinuation | Surfaces continue on the same plane. |
| buttJoint | One surface stops against another. |
| custom | User-defined behavior. |

---

## 14. Materials

A material is the installable product used on a surface.

Material examples:

```txt
Stone cladding 600 × 300 × 20 mm
Ceramic panel 1200 × 600 × 8 mm
Wood panel 900 × 150 × 12 mm
Metal sheet 1000 × 500 × 2 mm
Concrete board 600 × 300 × 30 mm
```

Material model:

```ts
type Material = {
  id: string;
  name: string;

  unitWidthMm: number;
  unitHeightMm: number;
  thicknessMm: number;

  defaultOrientation: "horizontal" | "vertical";
  defaultJointMm: number;

  minPieceWidthMm: number;
  minPieceHeightMm: number;

  style: MaterialStyle;
};
```

Material settings:

```txt
Name
Unit width
Unit height
Thickness
Default orientation
Default joint/gap width
Minimum allowed piece width
Minimum allowed piece height
Material color
Label color
Optional texture display
```

---

## 15. Material Thickness

Material thickness is required.

Thickness must be used in:

```txt
Material labels
Material cut list
Material quantity report
Overlap/corner details
PDF technical notes
Connection warnings
```

Example label:

```txt
A-07
600 × 300 × 20 mm
```

Cut piece label:

```txt
B-12
94 × 300 × 20 mm
```

Thickness behavior at connected edges:

```txt
Ignore thickness
Show thickness only
Compensate covered edge
Custom allowance
```

PDF notes should include:

```txt
Material thickness: 20 mm
Overlap areas are shown semi-transparent.
Verify corner fit before final fixing.
```

---

## 16. Joint / Gap

Use the term `joint / gap` instead of only `grout`.

Reason:

```txt
Stone may use grout.
Wood panels may use gaps.
Metal sheets may use expansion gaps.
Facade boards may use installation gaps.
Ceramic tiles may use grout joints.
```

Internal naming:

```ts
jointMm: number;
defaultJointMm: number;
```

Do not use `groutMm` in the main abstract data model.

---

## 17. Placement Patterns

A placement pattern defines how material units repeat across a surface.

Placement pattern model:

```ts
type PlacementPattern = {
  id: string;
  name: string;

  type:
    | "stacked"
    | "runningBondHalf"
    | "runningBondThird"
    | "verticalStacked"
    | "customOffset"
    | "diagonal";

  orientation: "horizontal" | "vertical" | "customAngle";

  angleDeg: number;

  jointMm: number;

  offsetXmm: number;
  offsetYmm: number;

  rowOffsetMm: number;
  rowOffsetPercent: number;

  originMode:
    | "surfaceCenter"
    | "topLeft"
    | "bottomLeft"
    | "customPoint";

  customOrigin?: Point2D;

  direction:
    | "leftToRight"
    | "rightToLeft"
    | "topToBottom"
    | "bottomToTop";

  symmetryMode:
    | "none"
    | "verticalAxis"
    | "horizontalAxis"
    | "customAxis";

  optimizationPriority: OptimizationPriority;
};
```

First version pattern types:

```txt
Horizontal stacked
Vertical stacked
Running bond 1/2
Running bond 1/3
Custom row offset
Custom angle
```

Later pattern types:

```txt
Diagonal 45°
Herringbone
Random layout
Multi-size modular layout
```

---

## 18. Manual Pattern Offset

The app must support manual offset by mouse and by exact values.

### 18.1 Mouse-Based Offset

The canvas should show a pattern origin handle.

Workflow:

```txt
1. Select surface.
2. Enable material layout view.
3. Drag pattern origin handle.
4. Material layout moves live.
5. Offset X and Offset Y update in the properties panel.
```

Snap options:

```txt
No snap
1 mm
5 mm
10 mm
Joint-step snap
Material-unit-step snap
```

### 18.2 Numeric Offset

Pattern panel fields:

```txt
Offset X: 0 mm
Offset Y: 0 mm
Angle: 0°
Row offset: 0 mm / 50%
```

Action buttons:

```txt
Center on surface
Align to left edge
Align to right edge
Align to top edge
Align to bottom edge
Reset offset
Apply to connected surfaces
Lock manual offset
```

---

## 19. Optimization Options

The user should be able to control what the application optimizes for.

UI options:

```txt
Waste priority: Low / Medium / High
Symmetry priority: Low / Medium / High
Cut count priority: Low / Medium / High
Small-piece penalty: Low / Medium / High
Joint alignment: Off / Selected surfaces / Connected group
Preserve manual offset: On / Off
```

Internal model:

```ts
type OptimizationPriority = {
  wasteWeight: number;
  symmetryWeight: number;
  cutCountWeight: number;
  smallPieceWeight: number;
  jointAlignmentWeight: number;
  manualOffsetLocked: boolean;
};
```

Optimization should not always choose the mathematically lowest waste. Sometimes the best real-world result is:

```txt
slightly more waste
better symmetry
fewer small pieces
fewer different cut sizes
better visual alignment
```

---

## 20. Edge Rules

Each surface edge can have its own behavior.

Edge rule model:

```ts
type EdgeRule = {
  id: string;
  surfaceId: string;
  edgeIndex: number;

  ruleType:
    | "hardStop"
    | "softBoundary"
    | "physicalOverlap"
    | "connectedOverlap";

  maxOverlapMm: number;
  overlapOpacity: number;

  connectedSurfaceId?: string;
  connectedEdgeIndex?: number;

  applyThicknessCompensation: boolean;
  customThicknessAllowanceMm?: number;
};
```

Rule meanings:

| Rule | Meaning |
|---|---|
| hardStop | Material cannot pass the surface edge. |
| softBoundary | Material may visually extend, but not as physical overlap. |
| physicalOverlap | Material physically extends beyond the edge up to a defined value. |
| connectedOverlap | Material extends across a connected edge toward another surface. |

---

## 21. Physical Overlap Visualization

Each material piece must have:

```txt
Visible polygon
Physical polygon
Overlap polygons
```

Material piece model:

```ts
type MaterialPiece = {
  id: string;

  surfaceId: string;
  materialId: string;

  pieceCode: string;

  sourceUnitIndex?: number;

  physicalPolygon: Point2D[];
  visiblePolygon: Point2D[];
  overlapPolygons: Point2D[][];

  boundingWidthMm: number;
  boundingHeightMm: number;
  thicknessMm: number;

  rotationDeg: number;

  isFullUnit: boolean;
  isCutPiece: boolean;
  isIrregular: boolean;

  labelPosition: Point2D;

  warnings: MaterialPieceWarning[];
};
```

Drawing behavior:

```txt
Visible area:
- normal material color
- normal opacity
- solid outline

Overlap area:
- same material color
- lower opacity, for example 25%
- dashed or dotted outline
- optional label: Overlap 23 mm
```

Overlap must be included in the physical size of the piece.

---

## 22. Material Layout Engine

The material layout engine receives:

```txt
Surface geometry
Surface holes
Connected surface rules
Material unit width
Material unit height
Material thickness
Joint/gap width
Placement pattern
Orientation
Manual offset X/Y
Overlap rules
Optimization priorities
Minimum allowed piece size
```

The output is:

```txt
Material layout
Material pieces
Visible polygons
Physical polygons
Overlap polygons
Cut list
Waste calculation
Warnings
```

---

## 23. Layout Algorithm

### 23.1 Prepare Surface

```txt
Validate closed polygon
Validate no self-intersections
Validate holes are inside surface
Subtract holes from surface
Calculate surface bounding box
Apply edge rules
Create visible zone
Create physical working zone with overlap expansions
```

### 23.2 Generate Candidate Layouts

Generate candidates by varying:

```txt
Orientation
Offset X
Offset Y
Pattern origin
Row offset
Symmetry axis
Direction
```

For a 600 × 300 mm material with 3 mm joint:

```txt
Horizontal step X = 600 + 3 = 603 mm
Horizontal step Y = 300 + 3 = 303 mm
```

For vertical orientation:

```txt
Vertical step X = 300 + 3 = 303 mm
Vertical step Y = 600 + 3 = 603 mm
```

### 23.3 Clip Material Pieces

Each generated material unit rectangle is clipped twice:

```txt
1. Clip to physical working zone.
2. Clip to visible surface zone.
```

Then:

```txt
overlap area = physical polygon - visible polygon
```

### 23.4 Reject Or Warn About Bad Pieces

Warn when:

```txt
Piece width is below minimum
Piece height is below minimum
Visible area is too small
Piece is a very thin strip
Piece is irregular and needs template cutting
Overlap is enabled but edge is not connected
```

### 23.5 Score Layout

Example scoring formula:

```txt
score =
  wasteAreaMm2 * wasteWeight
+ cutPieceCount * cutCountWeight
+ smallPiecePenalty * smallPieceWeight
+ asymmetryPenalty * symmetryWeight
+ jointMisalignmentPenalty * jointAlignmentWeight
```

Lowest score wins.

---

## 24. Connected Surface Pattern Behavior

For connected surfaces, the user can choose:

```txt
Independent pattern
Shared pattern origin
Continue joint lines across connection
Mirror pattern across connection
Manual per-surface pattern
```

Recommended first version:

```txt
Independent pattern
Shared pattern origin
Manual per-surface offset
```

Recommended second version:

```txt
Continue joint lines across connected surfaces
```

---

## 25. Material Layout Data Model

```ts
type MaterialLayout = {
  id: string;

  surfaceId: string;
  materialId: string;
  placementPatternId: string;

  generatedAt: string;

  pieces: MaterialPiece[];

  stats: MaterialLayoutStats;

  settingsSnapshot: {
    material: Material;
    placementPattern: PlacementPattern;
    edgeRules: EdgeRule[];
  };
};
```

Layout stats:

```ts
type MaterialLayoutStats = {
  visibleAreaMm2: number;
  physicalMaterialAreaMm2: number;
  purchasedMaterialAreaMm2: number;

  fullUnitCount: number;
  cutPieceCount: number;
  totalPieceCount: number;

  wasteAreaMm2: number;
  wastePercent: number;

  uniqueCutCount: number;
  smallPieceCount: number;
};
```

---

## 26. Cut List

The cut list must use physical piece size, not only visible size.

Reason:

```txt
If a material overlaps 23 mm past the edge, that 23 mm is real material.
It must be included in cutting and material quantity calculation.
```

Cut list item:

```ts
type MaterialCutListItem = {
  id: string;

  pieceCodes: string[];

  surfaceName: string;
  materialName: string;

  widthMm: number;
  heightMm: number;
  thicknessMm: number;

  quantity: number;

  isFullUnit: boolean;
  isRectangularCut: boolean;
  isIrregularCut: boolean;

  overlapIncluded: boolean;

  notes: string[];
};
```

Example table:

| Piece | Surface | Material | Size | Qty | Notes |
|---|---|---|---:|---:|---|
| A-01 | Front upper band | Beige material | 600 × 300 × 20 mm | 4 | Full units |
| A-05 | Left side | Beige material | 294 × 300 × 20 mm | 2 | Cut width |
| B-03 | Corner return | Beige material | 323 × 300 × 20 mm | 1 | Includes 23 mm overlap |
| C-01 | Around opening | Beige material | Irregular template | 1 | Cut by template |

---

## 27. Cutting Diagrams

The application should produce two levels of cutting detail.

### 27.1 Grouped Cut List

Example:

```txt
600 × 300 × 20 mm — 12 pieces
294 × 300 × 20 mm — 4 pieces
94 × 300 × 20 mm — 2 pieces
323 × 300 × 20 mm — 2 pieces, includes 23 mm overlap
```

### 27.2 Per-Unit Cutting Diagram

Example:

```txt
Source material unit #1: 600 × 300 × 20 mm
- Use full piece A-01

Source material unit #2: 600 × 300 × 20 mm
- Cut B-03: 323 × 300 × 20 mm
- Remaining offcut: 277 × 300 × 20 mm
```

Saw blade kerf is not required in the first version.

The data model may include an optional disabled field for future use:

```ts
bladeKerfMm?: number;
```

---

## 28. Waste Calculation

The application should calculate:

```txt
Total visible surface area
Total physical material area used
Total purchased material area
Full material units required
Cut pieces count
Waste area
Waste percentage
Unique cut dimensions
Small piece count
```

Definitions:

```txt
Visible surface area = area actually covered on named surfaces.
Physical material area = visible area + physical overlap areas.
Purchased material area = number of full material units × unit area.
Waste area = purchased material area - physical material area.
Waste percentage = waste area / purchased material area × 100.
```

---

## 29. Labels And Dimension Display

Each object can show or hide labels.

### 29.1 Surface Labels

Surfaces can show:

```txt
Surface name
Surface area
Assigned material
Boundary dimensions
Opening dimensions
```

### 29.2 Material Piece Labels

Material pieces can show:

```txt
Piece ID
Piece size
Thickness
Cut status
Surface name
Overlap note
```

Examples:

```txt
A-07
600 × 300 × 20 mm
```

```txt
B-12
94 × 300 × 20 mm
Overlap included
```

### 29.3 Dimension Labels

Dimensions should support:

```txt
mm
cm
m
custom text override
automatic formatting
```

---

## 30. Styling

Every drawable object should have editable style settings.

```ts
type DrawingStyle = {
  strokeColor: string;
  strokeWidthPx: number;
  strokeDash?: number[];
  fillColor?: string;
  fillOpacity?: number;
  textColor: string;
  fontSizePx: number;
};
```

Editable styles:

```txt
Line color
Line thickness
Line dash style
Fill color
Fill opacity
Text color
Text size
Dimension text color
Material color
Material label color
Joint/gap color
Overlap opacity
```

Important rule:

```txt
Names are assigned to surfaces, not to materials only.
```

Example:

```txt
Surface name: Front left column
Material name: Beige cladding material 600 × 300 × 20
```

---

## 31. Layers

The editor should use layers.

Recommended layers:

```txt
Background image
Construction geometry
Surfaces
Openings
Dimensions
Material layout
Overlap zones
Labels
Helper guides
Warnings
```

Each layer supports:

```txt
Visible / hidden
Locked / unlocked
Opacity
```

---

## 32. Background Image Import And Calibration

The app should allow importing an image as a background reference.

Workflow:

```txt
1. Import image.
2. Place image on canvas.
3. Pick two known points on the image.
4. Enter real distance, for example 2000 mm.
5. App calculates scale.
6. User optionally rotates/positions image.
7. User locks image layer.
8. User draws measured geometry over it.
```

Image settings:

```txt
Opacity
Lock/unlock
Show/hide
Scale
Rotation
Position
Calibration distance
```

---

## 33. Snapping And Grid

Snapping options:

```txt
Snap to grid
Snap to points
Snap to line endpoints
Snap to line midpoint
Snap to surface edges
Snap to intersections
Snap to horizontal/vertical axes
Snap to angles, for example 0°, 45°, 90°
```

Grid settings:

```txt
Grid size in mm
Show/hide grid
Major grid every N lines
Snap tolerance
```

---

## 34. Validation And Warnings

The app should continuously validate the project.

Warnings:

```txt
Surface is not closed.
Surface polygon self-intersects.
Opening is outside the surface.
Opening intersects another opening.
Material is not assigned.
Placement pattern is not assigned.
Material thickness is missing.
Joint/gap width is invalid.
Overlap is enabled but no edge is selected.
Overlap exceeds configured maximum.
Piece is smaller than minimum allowed width.
Piece is smaller than minimum allowed height.
Piece is irregular and needs template cutting.
Connected edges have different lengths.
Two surfaces overlap unexpectedly.
Manual offset is locked, so optimization did not change it.
```

Warnings should be clickable and should zoom to the related object.

---

## 35. Undo / Redo

All user actions should be represented as commands.

Command model:

```ts
type Command = {
  id: string;
  label: string;
  do(project: Project): Project;
  undo(project: Project): Project;
};
```

Commands:

```txt
DrawLineCommand
DrawRectangleCommand
DrawPolygonCommand
CreateSurfaceCommand
CreateOpeningCommand
SplitSurfaceCommand
ConnectSurfaceCommand
AssignMaterialCommand
ChangePlacementPatternCommand
MovePatternOriginCommand
ChangeOffsetCommand
GenerateMaterialLayoutCommand
MoveMaterialPieceCommand
ChangeStyleCommand
DeleteObjectCommand
ImportBackgroundImageCommand
CalibrateBackgroundImageCommand
```

---

## 36. Local Storage

The app must be local browser-only.

Storage plan:

```txt
IndexedDB:
- Projects
- Background images
- Large project JSON data
- Generated thumbnails

localStorage:
- Last opened project ID
- UI preferences
- Theme
- Grid setting
- Last used units
```

Project import/export:

```txt
Export project as .json
Import project from .json
```

No server is required.

---

## 37. Project Data Model

Top-level project:

```ts
type Project = {
  id: string;
  name: string;
  unit: "mm";

  createdAt: string;
  updatedAt: string;

  settings: ProjectSettings;

  materials: Material[];
  surfaces: Surface[];
  surfaceConnections: SurfaceConnection[];

  drawingEntities: DrawingEntity[];
  dimensions: DimensionEntity[];
  labels: LabelEntity[];

  placementPatterns: PlacementPattern[];
  materialLayouts: MaterialLayout[];

  backgroundImages: BackgroundImageRef[];

  pdfSettings: PdfExportSettings;
};
```

Project settings:

```ts
type ProjectSettings = {
  gridSizeMm: number;
  snapEnabled: boolean;
  snapTolerancePx: number;

  defaultLineColor: string;
  defaultTextColor: string;

  defaultOverlapOpacity: number;

  autosaveEnabled: boolean;
};
```

Point model:

```ts
type Point2D = {
  x: number;
  y: number;
};
```

---

## 38. PDF Export

The PDF must be a practical technical document for installation.

### 38.1 Page 1 — Project Summary

Content:

```txt
Project name
Date
Units
Material name
Material unit size
Material thickness
Joint/gap width
Overlap settings
Number of surfaces
Total visible area
Total material required
Waste estimate
Number of full units
Number of cut pieces
Number of warnings
```

---

### 38.2 Page 2 — Final Material Appearance

This page should show how the result should look after installation.

Content:

```txt
Rendered surfaces
Material placement pattern
Joint/gap lines
Surface names
Optional piece IDs
Semi-transparent overlap zones
```

Purpose:

```txt
Visual understanding for the user and installer.
```

---

### 38.3 Page 3 — Technical Drawing With Dimensions

Content:

```txt
Outer dimensions
Opening dimensions
Surface names
Connected edges
Dimension lines
Angles where needed
Material thickness note
Scale indicator
```

Purpose:

```txt
Measurement and verification.
```

---

### 38.4 Page 4 — Material Layout

Content:

```txt
Every material piece
Piece ID
Piece size
Joint/gap width
Pattern direction arrow
Pattern origin
Manual offset values
Symmetry axis, if enabled
Overlap areas
```

Purpose:

```txt
Installation guide.
```

---

### 38.5 Page 5 — Material Cut List

Table columns:

```txt
Piece ID or group
Surface
Material
Size
Quantity
Thickness
Overlap included
Notes
```

---

### 38.6 Page 6+ — Cutting Diagrams

Content:

```txt
Source material unit size
Cut lines
Piece IDs
Remaining offcut
Irregular template notes
```

---

### 38.7 Final Page — Installation Instructions

Example instructions:

```txt
1. Start from the marked placement origin.
2. Install full material units first.
3. Maintain the specified joint/gap width.
4. Pieces with semi-transparent overlap zones physically extend past the selected surface edge.
5. Check connected surfaces and corner fit before final fixing.
6. Cut pieces according to the material cut list.
7. Match installed pieces using the printed piece IDs.
8. Verify material thickness and overlap direction at connected corners.
```

---

## 39. PDF Export Settings

PDF settings model:

```ts
type PdfExportSettings = {
  paperSize: "A4" | "A3";
  orientation: "portrait" | "landscape";
  scaleMode: "auto" | "fixed" | "custom";
  fixedScale?: "1:5" | "1:10" | "1:20";
  customScale?: number;

  includeFinalAppearance: boolean;
  includeTechnicalDrawing: boolean;
  includeMaterialLayout: boolean;
  includeDimensions: boolean;
  includeSurfaceNames: boolean;
  includePieceIds: boolean;
  includePieceDimensions: boolean;
  includeOverlapZones: boolean;
  includeCutList: boolean;
  includeCuttingDiagrams: boolean;
  includeInstallationInstructions: boolean;
};
```

---

## 40. Right Properties Panel

### 40.1 Selected Line

Fields:

```txt
Start X
Start Y
End X
End Y
Length
Angle
Name
Show dimension
Line color
Line thickness
Text color
```

---

### 40.2 Selected Surface

Fields:

```txt
Surface name
Assigned material
Placement pattern
Show name
Show dimensions
Show area
Line color
Fill color
Text color
Edge rules
Connected surfaces
```

---

### 40.3 Selected Material

Fields:

```txt
Material name
Unit width
Unit height
Thickness
Default joint/gap
Default orientation
Minimum piece width
Minimum piece height
Material color
Label color
```

---

### 40.4 Selected Placement Pattern

Fields:

```txt
Pattern type
Orientation
Angle
Joint/gap width
Offset X
Offset Y
Row offset
Origin mode
Direction
Symmetry mode
Optimization priorities
```

---

### 40.5 Selected Material Piece

Fields:

```txt
Piece ID
Surface
Material
Physical size
Visible size
Thickness
Full unit / cut piece
Overlap included
Warnings
```

---

## 41. Bottom Panel

The bottom panel should have tabs:

```txt
Surfaces
Materials
Material layouts
Cut list
Warnings
Project stats
```

### 41.1 Surfaces Tab

Shows:

```txt
Surface name
Assigned material
Pattern
Area
Warnings
Visibility
Lock state
```

### 41.2 Materials Tab

Shows:

```txt
Material name
Unit size
Thickness
Default joint/gap
Used on surfaces
```

### 41.3 Material Layouts Tab

Shows:

```txt
Surface
Material
Full units
Cut pieces
Waste
Small pieces
Last generated time
```

### 41.4 Cut List Tab

Shows grouped material cuts.

### 41.5 Warnings Tab

Shows validation warnings with clickable links to objects.

---

## 42. React Architecture

Recommended stack:

```txt
React
TypeScript
react-konva / Konva for 2D canvas
Zustand or Redux Toolkit for state
Zod for schema validation
IndexedDB for local project storage
pdf-lib or equivalent for PDF generation
Web Worker for layout optimization
```

Key architecture rule:

```txt
React components render state.
Domain modules calculate geometry.
Canvas does not own business logic.
```

---

## 43. Recommended Project Structure

```txt
src/
  app/
    App.tsx
    routes.tsx

  components/
    Button/
    Dialog/
    InputNumberWithUnit/
    ColorPicker/
    Panel/
    Toolbar/

  features/
    editor/
      EditorPage.tsx
      CanvasStage.tsx
      CanvasLayers.tsx
      EditorToolbar.tsx
      PropertiesPanel.tsx
      BottomPanel.tsx

    drawingTools/
      SelectTool.ts
      LineTool.ts
      RectangleTool.ts
      PolygonTool.ts
      OpeningTool.ts
      DimensionTool.ts
      SurfaceTool.ts
      ConnectionTool.ts
      PatternOriginTool.ts

    surfaces/
      SurfaceList.tsx
      SurfaceProperties.tsx
      EdgeRulesPanel.tsx
      SurfaceConnectionDialog.tsx

    materials/
      MaterialList.tsx
      MaterialEditor.tsx

    placementPatterns/
      PlacementPatternPanel.tsx
      OptimizationPanel.tsx
      PatternOffsetControls.tsx

    materialLayout/
      MaterialLayoutRenderer.tsx
      MaterialPieceLabel.tsx
      MaterialCutListTable.tsx
      MaterialLayoutStats.tsx

    exportPdf/
      PdfExportDialog.tsx
      PdfPreview.tsx

  domain/
    geometry/
      point.ts
      line.ts
      polygon.ts
      rectangle.ts
      dimension.ts
      transform.ts
      clipping.ts
      offsetPolygon.ts
      validation.ts

    surfaces/
      createSurface.ts
      splitSurface.ts
      connectSurfaces.ts
      edgeRules.ts

    materials/
      material.ts

    placementPatterns/
      placementPattern.ts
      generatePlacementGrid.ts
      manualOffset.ts

    materialLayout/
      generateMaterialCandidates.ts
      clipMaterialPieceToSurface.ts
      calculateMaterialOverlap.ts
      scoreMaterialLayout.ts
      optimizeMaterialLayout.ts
      materialCutList.ts
      materialCuttingDiagram.ts

    pdf/
      pdfDocument.ts
      renderSummaryPage.ts
      renderFinalAppearancePage.ts
      renderTechnicalDrawingPage.ts
      renderMaterialLayoutPage.ts
      renderMaterialCutListPage.ts
      renderCuttingDiagramPage.ts
      renderInstructionsPage.ts

  storage/
    indexedDb.ts
    projectRepository.ts
    jsonImportExport.ts

  state/
    projectStore.ts
    editorStore.ts
    selectionStore.ts
    historyStore.ts

  workers/
    materialLayoutOptimizer.worker.ts

  types/
    geometry.ts
    project.ts
    material.ts
    surface.ts
    placementPattern.ts
    materialLayout.ts
    pdf.ts
```

---

## 44. Non-Functional Requirements

### 44.1 Performance

The app should remain responsive while editing.

Requirements:

```txt
Canvas pan/zoom should feel smooth.
Simple layout generation should complete quickly.
Large optimization should run in a Web Worker.
UI should not freeze during optimization.
```

### 44.2 Accuracy

All geometry must be calculated in millimeters.

Requirements:

```txt
Do not rely on screen pixels for measurements.
Use double precision numbers internally.
Round only for display and export.
```

### 44.3 Reliability

Requirements:

```txt
Autosave project locally.
Allow JSON export for backup.
Protect against invalid project states.
Show warnings instead of silently failing.
```

### 44.4 Usability

Requirements:

```txt
Numeric inputs must be easy to use.
Keyboard shortcuts should exist for common tools.
Selected object must be visually obvious.
Warnings must be understandable.
PDF output must be readable by a non-technical installer.
```

---

## 45. Keyboard Shortcuts

Suggested shortcuts:

```txt
V: Select
L: Line
R: Rectangle
P: Polygon
O: Opening
D: Dimension
T: Label/Text
M: Measure
Delete: Delete selected
Ctrl/Cmd + Z: Undo
Ctrl/Cmd + Shift + Z: Redo
Ctrl/Cmd + S: Save
Ctrl/Cmd + E: Export
Space + drag: Pan
Mouse wheel: Zoom
Shift: Constrain angle
Alt: Disable snapping temporarily
Enter: Confirm numeric input or close polygon
Esc: Cancel current action
```

---

## 46. MVP Scope

The first useful version should include:

```txt
React + TypeScript application
Local browser-only storage
2D canvas editor
Line, rectangle, and polygon tools
Exact numeric drawing
Openings and holes
Named surfaces
Multiple connected 2D surfaces
Surface splitting
Style editing
One material per surface
Material width, height, and thickness
Joint/gap width
Basic placement patterns
Horizontal and vertical orientation
Manual offset by mouse
Manual offset by numeric input
Optimization priorities
Physical overlap by edge
Semi-transparent overlap display
Material piece labels
Material cut list
PDF export
JSON import/export
Background image import and calibration
Warnings panel
Undo/redo
```

---

## 47. MVP Exclusions

Do not include these in the first version unless absolutely necessary:

```txt
User accounts
Cloud saving
Full 3D modeling
Advanced mobile/touch editing
Multi-size pattern
Herringbone pattern
Advanced bin-packing
Saw kerf calculation
Material price calculation
Supplier database
Automatic AI recognition from photo
Online collaboration
```

---

## 48. Phase 2 Features

After the MVP:

```txt
Advanced connected-surface joint alignment
Better optimization search
Cutting diagram per source material unit
Irregular piece templates
SVG export
DXF export
A3 technical PDF templates
Custom title block
More pattern types
Surface grouping
Locked material pieces during re-optimization
Manual material piece editing
Advanced report settings
```

---

## 49. Phase 3 Features

Later:

```txt
Reusable project templates
Material library
Cost calculation
Edge finishing library
Offline PWA install mode
Touch/tablet support
Version history
Printable labels for material pieces
Project sharing through exported package files
```

---

## 50. Example Workflow: BBQ / Fireplace Front

This is only an example use case. The app itself remains abstract.

```txt
1. Create project: BBQ material layout.
2. Import existing sketch as background.
3. Calibrate image using known top width, for example 2000 mm.
4. Draw main front rectangle: 2000 × 2790 mm.
5. Draw upper opening: 1280 × 730 mm.
6. Draw lower opening: 1280 × 790 mm.
7. Define gap between openings: 160 mm.
8. Convert areas into named surfaces:
   - Left front column
   - Right front column
   - Top front band
   - Middle band
   - Lower band
   - Side/return surfaces if needed
9. Define material:
   - Name: Selected material
   - Unit: 600 × 300 × 20 mm
   - Joint/gap: 3 mm
10. Define edge rules:
   - Hard stop on visible outer boundaries
   - Physical overlap 23 mm on selected connected corners
   - Overlap opacity 25%
11. Define placement pattern:
   - Horizontal stacked or running bond
   - Centered on vertical axis
   - Manual offset allowed
12. Adjust offset:
   - Drag pattern origin by mouse
   - Or enter Offset X / Offset Y manually
13. Choose optimization:
   - Best symmetry
   - Avoid small pieces
   - Medium waste priority
   - Align joints on selected connected surfaces if needed
14. Generate layout.
15. Review:
   - Material piece labels
   - Overlap zones
   - Warnings
   - Cut list
16. Export PDF.
```

---

## 51. Acceptance Criteria

The application is ready for first production use when all of the following are true:

```txt
User can create a local project.
User can draw accurate measured 2D geometry.
User can draw lines by exact length and angle.
User can draw rectangles by exact width and height.
User can draw polygons with dimensioned edges.
User can create openings inside surfaces.
User can create named surfaces.
User can split a surface into multiple surfaces.
User can connect multiple 2D surfaces.
User can assign one material to each surface.
Material supports unit width, unit height, and thickness.
User can define joint/gap width.
User can define physical material overlap on selected edges.
Overlap is displayed semi-transparently.
User can choose placement pattern and orientation.
User can manually adjust horizontal and vertical offset by mouse.
User can manually enter horizontal and vertical offset values.
User can choose optimization priorities.
Every material piece can show its ID and size.
Cut pieces show physical size, including overlap.
Material cut list includes thickness.
PDF includes final appearance.
PDF includes technical drawing with dimensions.
PDF includes material layout.
PDF includes material cut list.
PDF includes cutting diagrams or grouped cutting instructions.
PDF includes installation instructions.
Project saves locally in the browser.
Project can be exported and imported as JSON.
Background image can be imported, calibrated, locked, and traced over.
Warnings are shown for invalid geometry and problematic pieces.
Undo/redo works for core editing actions.
```

---

## 52. Testing Plan

### 52.1 Unit Tests

Test:

```txt
Unit parser
Line length calculation
Angle calculation
Polygon area
Polygon validation
Opening inside surface validation
Surface split logic
Edge rule calculation
Overlap calculation
Material layout grid generation
Cut list grouping
Waste calculation
PDF data preparation
```

### 52.2 Integration Tests

Test workflows:

```txt
Create project
Draw rectangle
Create surface
Assign material
Generate layout
Export PDF
Save and reload project
Import and export JSON
```

### 52.3 Visual Tests

Test rendering:

```txt
Dimensions display correctly
Overlap opacity displays correctly
Material labels display correctly
Selected objects are highlighted
Background image calibration remains correct
PDF pages contain expected elements
```

### 52.4 Edge Case Tests

Test:

```txt
Tiny surfaces
Large surfaces
Very small joint/gap
Zero overlap
Maximum overlap
Invalid polygon
Self-intersecting polygon
Opening outside surface
Connected edges of different lengths
Material thicker than overlap
Manual offset outside surface bounds
```

---

## 53. Implementation Milestones

### Milestone 1 — Project Shell And Canvas

```txt
React + TypeScript setup
Main editor layout
Canvas pan/zoom
Grid and snapping basics
Local project model
Save/load local project
```

### Milestone 2 — Drawing Tools

```txt
Line tool
Rectangle tool
Polygon tool
Numeric input
Dimension display
Selection and editing
Undo/redo basics
```

### Milestone 3 — Surfaces And Openings

```txt
Create surfaces
Create openings
Surface names
Surface styling
Surface validation
Surface splitting
```

### Milestone 4 — Materials And Patterns

```txt
Material editor
Material thickness
Joint/gap settings
Placement pattern settings
Manual offset by input
Manual offset by mouse
```

### Milestone 5 — Material Layout Engine

```txt
Generate material grid
Clip to surface
Handle openings
Physical overlap
Semi-transparent overlap display
Warnings
Stats
```

### Milestone 6 — Optimization

```txt
Optimization priorities
Candidate generation
Scoring
Best layout selection
Manual offset lock
```

### Milestone 7 — Cut List And Waste

```txt
Material piece grouping
Cut list table
Waste calculation
Full unit count
Thickness in cut list
```

### Milestone 8 — PDF Export

```txt
Project summary page
Final appearance page
Technical drawing page
Material layout page
Cut list page
Installation instructions page
```

### Milestone 9 — Background Image

```txt
Image import
Image calibration
Image opacity
Image lock/unlock
Trace-over workflow
```

### Milestone 10 — Polish And Validation

```txt
Warnings panel
Keyboard shortcuts
Error handling
Performance improvements
Final acceptance testing
```

---

## 54. Summary

The application should be built as a general **2D Material Layout Planner**.

Its core objects are:

```txt
Surfaces
Materials
Placement patterns
Material pieces
Edge rules
Surface connections
Dimensions
Cut lists
PDF exports
```

The BBQ/fireplace example is only one use case. The same application should work for any measured 2D surface where rectangular material units are installed with joints/gaps, pattern rules, edge overlap, and cut planning.

The first production-ready version should focus on measured drawing, named surfaces, one material per surface, material thickness, placement patterns, manual offsets, physical overlap visualization, cut list generation, and PDF export.
