# CLAUDE.md - Plugin.old

This file provides guidance to Claude Code when working with the old TypeScript-based Figma to AEM plugin.

## Overview

This is the original TypeScript implementation of the Figma to AEM plugin. It has been superseded by the JavaScript version in the `/plugin` directory, but is kept for reference.

## Key Differences from Current Plugin

- Written in TypeScript (vs JavaScript in current)
- Targets Adobe AEM Content Fragments API (vs Adobe Odin in current)
- Uses vanilla JavaScript for UI (vs Lit + Spectrum Web Components in current)
- Different plugin ID: `figma-to-aem-plugin-old`

## Development Commands

```bash
# Install dependencies
npm install

# Build plugin
npm run build         # Build everything
npm run build:code    # Build plugin code only
npm run build:ui      # Build UI code only

# Watch mode
npm run watch         # Watch all files
npm run watch:code    # Watch plugin code
npm run watch:ui      # Watch UI code

# Development (build + watch)
npm run dev
```

## Architecture

### Core Files
- **src/code.ts**: Main Figma plugin entry point (TypeScript)
- **src/ui.js**: UI logic using vanilla JavaScript
- **ui.html**: Plugin UI HTML template
- **src/alt_nodes/**: Node transformation system
  - `base_node.ts`: Base class with TypeScript types
  - `builder.ts`: Factory for creating node instances
  - `text_node.ts`, `asset_node.ts`, `fragment_node.ts`: Specialized nodes

### Key TypeScript Types
```typescript
enum AltType {
  FRAGMENT = 'FRAGMENT',
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  LINK = 'LINK',
  LIST = 'LIST',
  BUTTONS = 'BUTTONS',
  COLUMNS = 'COLUMNS',
  TABS = 'TABS',
  ACCORDION = 'ACCORDION',
  UNKNOWN = 'UNKNOWN'
}
```

### API Endpoints
- Base URL: `https://author-p22655-e59341.adobeaemcloud.com`
- Content Fragments: `/adobe/sites/cf/`
- Models: `/adobe/sites/cf/models/json`

### Plugin-UI Communication
Uses postMessage API with these message types:
- `selectionchange`: Figma → UI (selected nodes data)
- `get-selection`: UI → Figma (request current selection)
- `create-rectangles`: UI → Figma (create nodes)
- `cancel`: UI → Figma (close plugin)

## Important Notes

1. This plugin requires TypeScript compilation before use
2. The `dist/` directory contains built artifacts
3. IMS Access Token required for AEM API authentication
4. Uses esbuild for fast TypeScript compilation
5. All UI logic is in a single 660-line file (src/ui.js)

## Migration Guide

To understand changes when migrating to the current plugin:
1. Remove TypeScript types and enums
2. Replace AEM API calls with Odin API
3. Refactor UI from vanilla JS to Lit components
4. Update manifest.json with new plugin ID
5. Add Spectrum Web Components for UI consistency