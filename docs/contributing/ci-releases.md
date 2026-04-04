# CI & Releases

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

**Step 1 — Open a PR** against `main`. The [semVersie](https://github.com/ronaldphilipsen/semVersie) action inspects the PR title (preferred) and/or commit messages to determine the version bump, then adds a label to your PR:

| Label   | Meaning          |
| ------- | ---------------- |
| `major` | Breaking changes |
| `minor` | New features     |
| `patch` | Bug fixes        |

**Step 2 — Merge the PR**. Once merged, the release job bumps the version in `package.json`, `package-lock.json`, `manifest.json`, and `versions.json` (configured in `semver-config.toml`), builds the plugin, creates a release commit (`chore: release version X.Y.Z`), tags it, and publishes a GitHub Release with `main.js`, `manifest.json`, and `styles.css` as assets.

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
