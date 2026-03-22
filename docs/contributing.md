# Contributing

Pull requests and suggestions are welcome! Please open an issue or PR on [GitHub](https://github.com/NicoKNL/tasks-map).

## Development Environment

### Prerequisites

- [Node.js](https://nodejs.org/) >= 24.0.0
- npm >= 10.0.0
- [prek](https://prek.j178.dev) (optional but recommended — see [Pre-commit Hooks](#pre-commit-hooks-prek) below)

### Setup

<!-- prettier-ignore -->
1. Clone the repository:
   ```sh
   git clone https://github.com/NicoKNL/tasks-map.git
   cd tasks-map
   ```
2. Install dependencies:
   ```sh
   npm install
   ```

### Pre-commit Hooks (prek)

[prek](https://prek.j178.dev) is a git hook framework (written in Rust) that automatically runs checks before each commit, catching issues before they reach CI. The hook configuration lives in `prek.toml`.

The configured hooks run on every commit:

- **trailing-whitespace** — removes trailing whitespace
- **end-of-file-fixer** — ensures files end with a newline
- **check-added-large-files** — prevents accidentally committing large files
- **check-merge-conflict** — detects leftover merge conflict markers
- **check-npm-install** — verifies `node_modules` is up to date with `package-lock.json`
- **eslint** — runs `npm run lint`
- **prettier** — runs `npm run format`

To set up prek:

<!-- prettier-ignore -->
1. Install prek (see [prek installation docs](https://prek.j178.dev)):
   ```sh
   # macOS
   brew install j178/tap/prek

   # or via pip
   pip install prek
   ```

2. Install the git hooks into your local repo:
   ```sh
   prek install
   ```

From this point on, every `git commit` will automatically run the configured checks. If any check fails, the commit is aborted so you can fix the issue first.

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

### Local Installation in Obsidian

To test the plugin locally, symlink or copy the built output into your vault:

```sh
# Build first
npm run build

# Then copy main.js, manifest.json, and styles.css into:
# <your-vault>/.obsidian/plugins/tasks-map/
```

Enable the plugin in Obsidian under Settings → Community plugins.

## CI / Quality Checks

Every push and pull request to `main` triggers the **Qualify** workflow, which runs four parallel jobs:

- **Lint** — ESLint
- **Format** — Prettier
- **Test** — Jest
- **Build** — TypeScript type check + esbuild production build

All checks must pass before a PR can be merged.

## Releases & Semantic Versioning

Releases are fully automated via the **Release** workflow and follow [Semantic Versioning](https://semver.org/).

### How It Works

1. **Open a PR** against `main`. The [semVersie](https://github.com/ronaldphilipsen/semVersie) action automatically determines the version bump from the **PR title** and/or **commit messages** (PR title is preferred) and adds a label to your PR:
   - `major` — Breaking changes
   - `minor` — New features
   - `patch` — Bug fixes

2. **Merge the PR**. Once merged, the release job:
   1. Bumps the version in `package.json`, `package-lock.json`, `manifest.json`, and `versions.json` (configured in `semver-config.toml`).
   2. Builds the plugin.
   3. Creates a release commit (`chore: release version X.Y.Z`) and pushes it.
   4. Tags the commit and creates a GitHub Release with `main.js`, `manifest.json`, and `styles.css` as assets.

### Deployment to Obsidian

Obsidian's plugin update system works by pulling directly from GitHub Releases — there is no separate registry or upload step. When Obsidian checks for plugin updates, it:

1. Reads the `manifest.json` from the **latest GitHub Release** tag (not from `main`) to determine the available version.
2. Compares it against the locally installed version.
3. If newer, downloads `main.js`, `manifest.json`, and `styles.css` from that release's assets.

This means the release must include **exactly these three files** as release assets. The build output (`main.js`) is not committed to `main` — it only exists as a release artifact.

#### The Role of `versions.json`

Obsidian uses `versions.json` (read from the repository root on `main`) to check **compatibility**. It maps each plugin version to the minimum Obsidian app version required:

```json
{
  "0.18.0": "1.8.0",
  "0.19.0": "1.8.0"
}
```

If a user's Obsidian version is older than the `minAppVersion` declared for the latest release, Obsidian will not offer the update. The bump script appends each new version to this file automatically (currently hardcoded to `minAppVersion: 1.8.0`).

#### The Role of `manifest.json`

`manifest.json` serves double duty:

- **In the repo root on `main`**: Obsidian reads this to register the plugin in the community plugin list (id, name, description, author).
- **In the GitHub Release assets**: Obsidian reads this to determine the version number of the release.

Both are kept in sync by the release workflow.

### Commit Message Conventions

semVersie inspects your PR title (preferred) and commit messages to determine the version bump. Use conventional-style prefixes:

| Prefix                                                   | Bump            | Example                            |
| -------------------------------------------------------- | --------------- | ---------------------------------- |
| `fix:`                                                   | patch           | `fix: correct edge deletion logic` |
| `feat:`                                                  | minor           | `feat: add tag-based filtering`    |
| `feat!:`                                                 | major           | `feat!: overhaul task syntax`      |
| `chore:`, `docs:`, `ci:`, `refactor:`, `test:`, `style:` | patch (or none) | `docs: update contributing guide`  |

The semver label on the PR is what ultimately determines the bump, so you can also adjust the label manually if needed.

## API Documentation

See [Obsidian API Docs](https://github.com/obsidianmd/obsidian-api).
