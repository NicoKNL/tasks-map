# Development Environment

## Prerequisites

- [Node.js](https://nodejs.org/) >= 24.0.0
- npm >= 10.0.0
- [prek](https://prek.j178.dev) (optional but recommended — see [Pre-commit Hooks](#pre-commit-hooks-prek) below)

## Setup

Clone the repository:

```sh
git clone https://github.com/NicoKNL/tasks-map.git
cd tasks-map
```

Install dependencies:

```sh
npm install
```

## Pre-commit Hooks (prek)

[prek](https://prek.j178.dev) is a git hook framework (written in Rust) that automatically runs checks before each commit, catching issues before they reach CI. The hook configuration lives in `prek.toml`.

The configured hooks run on every commit:

- **trailing-whitespace** — removes trailing whitespace
- **end-of-file-fixer** — ensures files end with a newline
- **check-added-large-files** — prevents accidentally committing large files
- **check-merge-conflict** — detects leftover merge conflict markers
- **check-npm-install** — verifies `node_modules` is up to date with `package-lock.json`
- **eslint** — runs `npm run lint`
- **prettier** — runs `npm run format`

To set up prek, install it first:

```sh
# macOS
brew install j178/tap/prek

# or via pip
pip install prek
```

Then install the git hooks into your local repo:

```sh
prek install
```

From this point on, every `git commit` will automatically run the configured checks. If any check fails, the commit is aborted so you can fix the issue first.

## Commands

### Dev Mode

Start the esbuild watcher for live development:

```sh
npm run dev
```

### Build

Run a full production build (includes TypeScript type checking):

```sh
npm run build
```

### Lint & Format

```sh
npm run lint          # ESLint check
npm run lint:fix      # ESLint auto-fix
npm run format        # Prettier check
npm run format:fix    # Prettier auto-fix
```

### Test

```sh
npm test              # Run tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

## Local Installation in Obsidian

To test the plugin locally, copy the built output into your vault:

```sh
# Build first
npm run build

# Then copy main.js, manifest.json, and styles.css into:
# <your-vault>/.obsidian/plugins/tasks-map/
```

Enable the plugin in Obsidian under Settings → Community plugins.

## API Reference

See [Obsidian API Docs](https://github.com/obsidianmd/obsidian-api).
