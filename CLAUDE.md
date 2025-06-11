# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Figma plugin project that converts Figma designs to Adobe Odin content fragments. The project consists of:
- An Adobe AEM boilerplate application that hosts the plugin UI
- A Figma plugin that communicates with the UI via postMessage

## Development Commands

### Root Project (AEM Boilerplate)
```bash
# Install dependencies
npm install

# Run linting
npm run lint          # Run both JS and CSS linting
npm run lint:js       # Run JS linting only
npm run lint:css      # Run CSS linting only
npm run lint:fix      # Auto-fix linting issues

# Start development server with HTTPS
npm start             # Starts AEM proxy on https://local.adobe.com/plugin/ui.html
```

### Figma Plugin (/plugin directory)
```bash
# Install plugin dependencies
cd plugin
npm install

# Build plugin
npm run build         # Build both SWC and plugin code
npm run build:swc     # Build SWC bundle only
npm run build:code    # Build plugin code only

# Watch mode for development
npm run code:watch    # Watch and rebuild plugin code on changes
```

## Architecture

### Plugin Structure
- **plugin/code.js**: Main Figma plugin entry point that loads the UI from localhost and handles communication
- **plugin/ui.html**: Plugin UI HTML that loads from https://local.adobe.com during development
- **plugin/src/app/figmaodin-app.js**: Main UI component using Lit and Spectrum Web Components
- **plugin/src/alt_nodes/**: Node transformation system that converts Figma nodes to an intermediate format
  - `base_node.js`: Base class for all node types
  - `builder.js`: Factory for creating appropriate node types from Figma nodes
  - `text_node.js`, `asset_node.js`, `fragment_node.js`: Specialized node types

### Key Technical Details
- The plugin loads its UI from `https://local.adobe.com/plugin/ui.html` during development
- Communication between Figma plugin and UI uses postMessage API
- The plugin listens for Figma selection changes and automatically sends layer data to the UI
- Uses Lit framework for UI components with Spectrum Web Components for styling
- Requires IMS Access Token for Adobe Odin API authentication

### Development Workflow
1. Start the AEM development server: `npm start`
2. In a separate terminal, watch plugin changes: `cd plugin && npm run code:watch`
3. Load the plugin in Figma using the manifest at `plugin/manifest.json`
4. The plugin UI will load from your local development server
