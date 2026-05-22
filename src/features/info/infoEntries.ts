import type { ToolId } from '@/state/editorStore';
import type { SelectableKind } from '@/state/selectionStore';

export type InfoKey = ToolId | SelectableKind;

export type InfoEntry = {
  key: InfoKey;
  title: string;
  shortcut?: string;
  category: 'tool' | 'entity';
  whatItIs: string;
  whatItDoes: string;
  howToUse: string[];
  related: InfoKey[];
};

const ENTRIES: Record<InfoKey, InfoEntry> = {
  select: {
    key: 'select',
    title: 'Select tool',
    shortcut: 'V',
    category: 'tool',
    whatItIs:
      'The default pointer for picking, moving and editing entities on the canvas.',
    whatItDoes:
      'Picks the topmost entity under the cursor, supports additive selection with Shift/Ctrl, marquee drag, and shows edit handles for the active selection.',
    howToUse: [
      'Click an entity to select it; drag in empty space to marquee.',
      'Hold Shift or Ctrl while clicking to add or toggle entities.',
      'Click and drag a selection edge or vertex handle to resize/reshape.',
      'Click a vertex handle, then press Delete to remove that vertex and reconnect its neighbors.',
      'Press Esc to clear the selection; press Delete to remove selected entities when no vertex is active.',
    ],
    related: ['line', 'rectangle', 'polygon', 'surface', 'opening'],
  },

  line: {
    key: 'line',
    title: 'Line tool',
    shortcut: 'L',
    category: 'tool',
    whatItIs: 'A drafting tool that draws straight line segments between two points.',
    whatItDoes:
      'Creates line entities that can be chained into a polyline. Lines participate in snapping and can later be promoted to surface edges.',
    howToUse: [
      'Click a start point on the canvas.',
      'Click again to set the end point; keep clicking to chain segments.',
      'Hold Shift to constrain to 0/45/90 degree angles.',
      'Press Esc or Enter to finish the current polyline.',
    ],
    related: ['rectangle', 'polygon', 'dimension', 'surface', 'meter'],
  },

  rectangle: {
    key: 'rectangle',
    title: 'Rectangle tool',
    shortcut: 'R',
    category: 'tool',
    whatItIs: 'A drafting tool that creates an axis-aligned rectangle from two corners.',
    whatItDoes:
      'Drags out a rectangle entity used for quick shapes, surfaces and openings.',
    howToUse: [
      'Press and drag from one corner to the opposite corner.',
      'Hold Shift to constrain to a square.',
      'Hold Alt to draw from the center outward.',
      'Release to commit; press Esc while dragging to cancel.',
    ],
    related: ['line', 'polygon', 'surface', 'opening'],
  },

  polygon: {
    key: 'polygon',
    title: 'Polygon tool',
    shortcut: 'P',
    category: 'tool',
    whatItIs: 'A drafting tool for closed, multi-vertex shapes.',
    whatItDoes:
      'Lets you place an arbitrary number of vertices and closes them into a polygon used for irregular surfaces.',
    howToUse: [
      'Click to drop each vertex in order.',
      'Hover over the first vertex and click it (or press Enter) to close the polygon.',
      'Press Backspace to remove the last vertex.',
      'Press Esc to cancel the in-progress polygon.',
    ],
    related: ['line', 'rectangle', 'surface'],
  },

  surface: {
    key: 'surface',
    title: 'Surface tool',
    shortcut: 'F',
    category: 'tool',
    whatItIs:
      'A tool that promotes a closed shape into a named surface — the unit a material is applied to.',
    whatItDoes:
      'Wraps a polygon or rectangle into a surface entity with name, area, edges and assignable material/pattern.',
    howToUse: [
      'Activate the tool, then click inside a closed shape to convert it.',
      'Or draw a new outline directly; the result is registered as a surface.',
      'Use the Properties panel to rename, assign a material and choose a placement pattern.',
    ],
    related: ['polygon', 'rectangle', 'opening', 'patternOrigin', 'splitSurface'],
  },

  opening: {
    key: 'opening',
    title: 'Opening tool',
    shortcut: 'O',
    category: 'tool',
    whatItIs:
      'A tool for cutting holes (windows, sockets, ducts, etc.) out of a surface.',
    whatItDoes:
      'Subtracts a rectangle or polygon from the parent surface so materials and patterns flow around it.',
    howToUse: [
      'Activate the tool and pick the parent surface.',
      'Drag a rectangle, or click vertices for a polygonal opening.',
      'Edit position and size from the Properties panel after placement.',
    ],
    related: ['surface', 'rectangle', 'polygon'],
  },

  dimension: {
    key: 'dimension',
    title: 'Dimension tool',
    shortcut: 'D',
    category: 'tool',
    whatItIs: 'An annotation tool that adds measured dimension lines to the drawing.',
    whatItDoes:
      'Places a dimension between two points with an offset leader; the value updates automatically if the geometry changes.',
    howToUse: [
      'Click the first reference point, then the second.',
      'Move the mouse to choose the offset distance and side, then click to place.',
      'Snap to existing endpoints/midpoints for accurate references.',
    ],
    related: ['label', 'line', 'surface', 'meter'],
  },

  label: {
    key: 'label',
    title: 'Label tool',
    shortcut: 'T',
    category: 'tool',
    whatItIs: 'A text annotation tool for notes, callouts and identifiers.',
    whatItDoes: 'Places a free text label at the clicked location.',
    howToUse: [
      'Click on the canvas to drop a label.',
      'Type the text; press Enter to commit or Esc to cancel.',
      'Re-edit or move the label via the Properties panel and Select tool.',
    ],
    related: ['dimension', 'select'],
  },

  connection: {
    key: 'connection',
    title: 'Connection tool',
    shortcut: 'C',
    category: 'tool',
    whatItIs:
      'A tool that links two surface edges so they share a boundary in the layout (e.g. an inside corner).',
    whatItDoes:
      'Marks two edges as connected, which informs overlap rules and lets material wrap continuously across surfaces.',
    howToUse: [
      'Activate the tool, then click the first surface edge.',
      'Click the matching edge on the partner surface.',
      'Edit overlap and wrap behaviour from the connection properties.',
    ],
    related: ['surface', 'overlap', 'splitSurface'],
  },

  patternOrigin: {
    key: 'patternOrigin',
    title: 'Pattern origin tool',
    shortcut: 'M',
    category: 'tool',
    whatItIs:
      'A tool that adjusts the manual offset/origin of a placement pattern on a surface.',
    whatItDoes:
      'Drags the pattern handle so material rows and columns shift relative to the surface, without changing the underlying material grid.',
    howToUse: [
      'Activate the tool to reveal the origin handle on each patterned surface.',
      'Drag the handle to nudge the pattern; values update in the placement panel.',
      'Hold the snap toggle for whole-piece increments.',
    ],
    related: ['surface', 'patternHandle', 'materialPiece'],
  },

  splitSurface: {
    key: 'splitSurface',
    title: 'Split surface tool',
    shortcut: 'X',
    category: 'tool',
    whatItIs: 'A tool that divides one surface into two along a cut line.',
    whatItDoes:
      'Inserts a split through a surface, producing two independent surfaces that can carry different materials or patterns.',
    howToUse: [
      'Activate the tool and click the surface to split.',
      'Click a start point on one edge, then an end point on another edge.',
      'Each resulting surface keeps its own properties and can be reassigned.',
    ],
    related: ['surface', 'cut', 'connection'],
  },

  cut: {
    key: 'cut',
    title: 'Cut tool',
    shortcut: 'K',
    category: 'tool',
    whatItIs:
      'A tool for adding extra reference points on surface edges, used to define cuts and break long edges.',
    whatItDoes:
      'Inserts a point along an edge so it can be referenced by dimensions, connections or splits.',
    howToUse: [
      'Activate the tool and hover over an edge.',
      'Click on the edge to drop a point; it snaps along the edge.',
      'Use the Select tool afterwards to drag the new point.',
    ],
    related: ['splitSurface', 'line', 'select'],
  },

  meter: {
    key: 'meter',
    title: 'Meter tool',
    shortcut: 'M',
    category: 'tool',
    whatItIs:
      'A measurement tool that drops a dimensioned line between two points and shows live distances to surrounding shapes while you hover.',
    whatItDoes:
      'Displays orthogonal distances from the cursor to every nearby shape on both the X and Y axes, then commits a line entity with its length label permanently visible when you click two points.',
    howToUse: [
      'Move the cursor over the drawing to see live X/Y distances to neighbouring edges.',
      'Click a first point, then a second point to drop a measurement line with its length shown.',
      'Hold Shift while picking a point to snap it onto the nearest existing line or edge.',
      'Press Esc to cancel an in-progress measurement.',
    ],
    related: ['dimension', 'line', 'select'],
  },

  calibrateImage: {
    key: 'calibrateImage',
    title: 'Calibrate background image',
    category: 'tool',
    whatItIs:
      'A tool to set the real-world scale of a traced background image (photo, scan, plan).',
    whatItDoes:
      'Lets you pick two points on the image whose real distance you know, then scales the image so drawing on top is accurate.',
    howToUse: [
      'Import a background image first.',
      'Activate the tool and click the two endpoints of a known segment.',
      'Enter the real distance; the image rescales and locks in place.',
    ],
    related: ['backgroundImage', 'dimension', 'line'],
  },

  point: {
    key: 'point',
    category: 'entity',
    title: 'Point',
    whatItIs: 'A single 2D coordinate — the smallest geometric entity.',
    whatItDoes:
      'Acts as an anchor for lines, polygons, dimensions and snap targets.',
    howToUse: [
      'Points are created implicitly by drawing tools or explicitly by the Cut tool.',
      'Drag a point with the Select tool to reshape connected entities.',
    ],
    related: ['line', 'cut', 'select'],
  },

  materialPiece: {
    key: 'materialPiece',
    category: 'entity',
    title: 'Material piece',
    whatItIs:
      'A single placed tile/panel produced by the material grid on a surface.',
    whatItDoes:
      'Represents one cut piece in the final layout, complete with position, clipping and waste status.',
    howToUse: [
      'Material pieces are generated automatically once a surface has a material and pattern.',
      'Select a piece to inspect its size, source row/column and clipping in the Properties panel.',
      'Adjust the pattern origin or material parameters to influence pieces globally.',
    ],
    related: ['surface', 'patternOrigin', 'overlap'],
  },

  patternHandle: {
    key: 'patternHandle',
    category: 'entity',
    title: 'Pattern handle',
    whatItIs:
      'The on-canvas grip that represents the placement pattern origin for a surface.',
    whatItDoes:
      'Displays the current pattern offset and lets you drag it to shift the layout.',
    howToUse: [
      'Switch to the Pattern origin tool to show handles on patterned surfaces.',
      'Drag the handle to move the pattern; release to commit.',
    ],
    related: ['patternOrigin', 'surface', 'materialPiece'],
  },

  overlap: {
    key: 'overlap',
    category: 'entity',
    title: 'Overlap region',
    whatItIs:
      'A physical material overlap across a connected edge between two surfaces.',
    whatItDoes:
      'Shows where material from one surface continues onto another, with reduced opacity to indicate the doubled coverage.',
    howToUse: [
      'Create a connection between two surface edges first.',
      'Enable overlap on the connection and choose the donor side.',
      'Inspect the resulting region by selecting it; tweak overlap distance in properties.',
    ],
    related: ['connection', 'surface', 'materialPiece'],
  },

  backgroundImage: {
    key: 'backgroundImage',
    category: 'entity',
    title: 'Background image',
    whatItIs: 'An imported raster image placed behind the drawing as a tracing reference.',
    whatItDoes:
      'Provides a visual underlay you can calibrate and trace; never participates in measurements until calibrated.',
    howToUse: [
      'Use File / Import to add an image.',
      'Run the Calibrate background image tool to set its real-world scale.',
      'Lock or adjust opacity from the layer settings.',
    ],
    related: ['calibrateImage', 'line', 'polygon'],
  },
};

export const INFO_ENTRIES = ENTRIES;

export const getInfoEntry = (key: InfoKey | null | undefined): InfoEntry | null => {
  if (!key) return null;
  return ENTRIES[key] ?? null;
};

export const ALL_INFO_KEYS: InfoKey[] = Object.keys(ENTRIES) as InfoKey[];
