# 📐 2D Material Layout Planner

> 🧱 A local, browser-only app for planning how rectangular materials are laid out across measured 2D surfaces.

Draw real-world geometry, assign materials, preview placement patterns, and export cut lists and PDF documentation — all from your browser, with **no server, no account, no cloud**.

## ✨ Features

- 🖊️ Accurate 2D drawing with real dimensions, grid, and snapping
- 🧩 Named surfaces, openings, and multi-surface connections
- 🎨 Material library with size, thickness, joints, and styles
- 🔁 Placement patterns (stacked, running bond, custom offsets, …)
- 🪚 Auto-generated cut lists, cutting diagrams, and waste reports
- ↔️ Physical edge overlap with semi-transparent visualization
- 🖼️ Background image import with two-point calibration
- 💾 Local project storage + JSON import/export
- 📄 One-click PDF export with technical drawings and instructions

## 🧰 Tech Stack

⚛️ React · 🟦 TypeScript · ⚡ Vite · 🐻 Zustand · 🎭 Konva · 📕 pdf-lib · 🧪 Vitest

## 🛠️ Development

Requires **Node `>= 20.10`** and **npm**.

```sh
npm install        # 📦 install dependencies
npm run dev        # 🚀 start dev server
npm test           # 🧪 run tests
npm run build      # 🏗️ build for production
npm run preview    # 👀 preview the production build
```

## 📚 Documentation

Detailed documentation for every feature, tool, data model, and workflow lives on the **[GitHub Wiki](https://github.com/fihorvat/material-layout-planner/wiki)**.

Quick links:

- 🖊️ [2D Drawing Tools](https://github.com/fihorvat/material-layout-planner/wiki/2D-Drawing-Tools)
- 🧩 [Surfaces, Openings & Connections](https://github.com/fihorvat/material-layout-planner/wiki/Surfaces-Openings-and-Connections)
- 🎨 [Material Library](https://github.com/fihorvat/material-layout-planner/wiki/Material-Library)
- 🔁 [Placement Patterns](https://github.com/fihorvat/material-layout-planner/wiki/Placement-Patterns)
- 🪚 [Cut Lists & Layouts](https://github.com/fihorvat/material-layout-planner/wiki/Cut-Lists-and-Layouts)
- ↔️ [Edge Overlap Visualization](https://github.com/fihorvat/material-layout-planner/wiki/Edge-Overlap-Visualization)
- 🖼️ [Background Image Calibration](https://github.com/fihorvat/material-layout-planner/wiki/Background-Image-Calibration)
- 💾 [Local Storage & JSON Import/Export](https://github.com/fihorvat/material-layout-planner/wiki/Local-Storage-and-JSON-Import-Export)
- 📄 [PDF Export](https://github.com/fihorvat/material-layout-planner/wiki/PDF-Export)

When you change a feature in this codebase, you **must** also update the matching wiki page. See [`AGENTS.md`](./AGENTS.md) for the agent-level rules.
