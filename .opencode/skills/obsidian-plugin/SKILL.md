---
name: obsidian-plugin
description: Patterns and conventions for Obsidian plugin development with React and esbuild
---

## Obsidian Plugin Architecture

This project is an Obsidian plugin. Key patterns to follow:

### Plugin Lifecycle

- The plugin class extends `Plugin` from the `obsidian` module.
- Register views, commands, settings tabs, and ribbon icons in `onload()`.
- Clean up in `onunload()`.

### Views

- Custom views extend `ItemView` from `obsidian`.
- Each view has a unique `VIEW_TYPE` constant.
- React is mounted into the view's `contentEl` via `createRoot`.
- Wrap React trees with context providers for `App` and plugin settings.

### Vault Operations

- Use `app.vault` for file read/write operations.
- Use `app.metadataCache` for frontmatter and metadata.
- All vault operations are async -- use `await`, never `.then()`.
- Use optimistic UI updates with rollback in `catch` blocks.

### Dataview Integration

- Dataview plugin access requires casting through `any` with an ESLint disable comment.
- Access pattern: `(app as any).plugins?.plugins?.["dataview"]`
- Always check if Dataview is installed/enabled before using its API.

### esbuild Configuration

- Output format: CommonJS (`cjs`).
- External packages: `obsidian`, `electron`, `@codemirror/*` -- never bundle these.
- The bundle target is a single `main.js` file.

### Settings

- Settings extend `PluginSettingTab`.
- Define a `DEFAULT_SETTINGS` constant with all defaults.
- Settings are persisted via `this.loadData()` / `this.saveData()`.

### Styling

- Use a single `global.css` (or `styles.css`) file.
- No inline styles (enforced by ESLint).
- Obsidian CSS variables are available for theming consistency.

### i18n

- All user-facing strings go through `t()` from i18next.
- Translation files: `src/i18n/locales/{en,nl,zh-CN}.json`.
- Always add keys to all locale files when creating new strings.
