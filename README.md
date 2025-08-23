<div align="center">
  <img src="public/icon-128.png" alt="Cigi Overlay logo"/>
  <h1>Cigi Overlay</h1>
  <p><em>Alpha</em> — Chrome/Firefox extension to overlay a floating control and draggable window on any page.</p>
</div>

## Contents
- [Overview](#overview)
- [Features](#features)
- [Usage](#usage)
  - [Getting Started](#getting-started)
  - [Load in Browser](#load-in-browser)
  - [Build](#build)
- [Architecture](#architecture)
- [Credits](#credits)

## Overview
Cigi Overlay adds a lightweight UI layer on top of any website:
- A movable Floating Action Button (FAB) to open the overlay window
- A draggable, resizable window hosting future tools (tabs for Overview, Layers, Settings)
- Theme toggle (light/dark) and i18n-ready text labels

This repository is currently in alpha. Expect frequent changes and incomplete features.

## Features
- React 19 + TypeScript + Vite build
- Tailwind CSS 4 for styling and utility classes
- Manifest v3 builds for Chrome and Firefox
- i18n override via `_locales` with runtime locale switching
- Theme system with CSS variables injected at runtime
- Content script UI: FAB, draggable/resizable overlay window, snap-to-side, position persistence

## Usage

### Getting Started
1. Install dependencies
   - `npm i` or `yarn`
2. Start development (Chrome default)
   - `npm run dev` or `yarn dev`
   - For Firefox: `npm run dev:firefox` or `yarn dev:firefox`

### Load in Browser
Chrome
1. Open `chrome://extensions`
2. Enable Developer mode
3. Load unpacked → select `dist_chrome`

Firefox
1. Open `about:debugging#/runtime/this-firefox`
2. Load Temporary Add-on → select any file in `dist_firefox`

### Build
- Chrome: `npm run build` or `npm run build:chrome`
- Firefox: `npm run build:firefox`

## Architecture
- `src/pages/content/index.tsx`: Injects the FAB and overlay window, manages drag/resize, storage listeners, and theme/i18n application.
- `src/utils/theme.ts`: Applies theme palette by writing CSS variables to `:root` and sets `data-theme`.
- `src/utils/i18n.ts`: Lightweight runtime i18n override loader using Chrome storage.
- `src/pages/popup/*`: Popup UI with toggles for overlay, FAB visibility, theme, and locale.
- `vite.config.*`: Shared base config generates a manifest with numeric `version` and `version_name` reflecting the package version (e.g. `0.1.0-alpha.0`).

## Credits
This project is based on and heavily inspired by the excellent template `vite-web-extension` by JohnBra. Many build and workflow conventions originate from that template.
