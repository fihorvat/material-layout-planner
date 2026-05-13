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

Detailed documentation for tools, data model, workflows, and deployment lives on the **GitHub Wiki**.
