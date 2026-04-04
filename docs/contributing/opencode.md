# OpenCode

This project includes an [OpenCode](https://opencode.ai) configuration that provides AI-assisted development tooling. The setup lives in two places:

- `opencode.json` — project-level config (watcher ignore list)
- `.opencode/` — custom commands, subagents, and skills

You do not need OpenCode to contribute. Everything it does can be done manually with the standard npm scripts. It is an optional productivity layer on top of the existing workflow.

## Configuration

`opencode.json` at the project root tells OpenCode which directories to ignore when watching for file changes:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "watcher": {
    "ignore": ["node_modules/**", "dist/**", ".git/**", "coverage/**"]
  }
}
```

## Custom Commands

Custom slash commands live in `.opencode/commands/`. They are invoked inside OpenCode with `/command-name`.

| Command   | What it does                                                                                       |
| --------- | -------------------------------------------------------------------------------------------------- |
| `/test`   | Runs `npm test`, analyzes any failures, and fixes them. Re-runs until all tests pass.              |
| `/lint`   | Runs `npm run lint`. Fixes issues manually per project conventions (does not blindly use `--fix`). |
| `/format` | Runs `npm run format`. If there are issues, auto-fixes with `npm run format:fix`.                  |
| `/check`  | Full pipeline: build → lint → test → format. Fixes each failing step before moving to the next.    |

`/check` is the most useful before opening a PR — it mirrors the four parallel jobs that CI runs.

## Custom Subagents

Subagents live in `.opencode/agents/`. They are invoked with `@agent-name` inside a prompt.

### `@code-reviewer`

Reviews code for bugs, type-safety issues, and convention violations. Reports findings with file, line number, severity, and a suggested fix. **Cannot modify files** — read-only by design, so it is safe to run on any branch.

Use it when you want a second pass before pushing:

```
@code-reviewer review the changes in src/lib/filter-tasks.ts
```

### `@test-writer`

Writes Jest tests following the project's testing conventions: `test/` directory, `makeTask()` factory helpers, `it.each` for parameterized cases, `describe("edge cases", ...)` blocks, and manual mocks for Obsidian/React/ReactFlow dependencies.

Use it to add coverage for new or modified logic in `src/lib/` or `src/types/`:

```
@test-writer add tests for the new normalizeTag helper in src/lib/utils.ts
```

### `@i18n-helper`

Manages translation keys across all three locale files (`en`, `nl`, `zh-CN`). Adds new keys to all locales simultaneously, uses English as the source of truth, and follows the project's dot-notation key structure.

Use it when adding any user-facing string:

```
@i18n-helper add a translation key for the new "Clear filters" button label
```

### `@docs-writer`

Writes and updates Zensical documentation for both users (`docs/getting-started/`) and contributors (`docs/contributing/`). Reads existing pages first to match tone and structure.

Use it when source code changes need documentation updates:

```
@docs-writer update the settings reference to document the new defaultGroupBy option
```

## Skills

Skills are loaded on demand with the `skill` tool inside OpenCode. Each skill
injects domain-specific instructions into the agent's context.

### `obsidian-plugin`

File: `.opencode/skills/obsidian-plugin/SKILL.md`

Provides patterns and conventions for:

- Plugin lifecycle (`onload`, `onunload`)
- Obsidian views and leaf management
- Vault read/write operations
- Dataview plugin integration
- esbuild externals
- Settings tab patterns
- i18n setup

Loaded automatically when a task involves Obsidian plugin patterns.

### `docs-writer`

File: `.opencode/skills/docs-writer/SKILL.md`

Provides Zensical / Material for MkDocs syntax reference and writing conventions
for this project's documentation, including:

- Admonitions (note, tip, warning, collapsible, inline)
- Code blocks with titles, line numbers, and highlighted lines
- Content tabs
- Page frontmatter
- Tone, structure, and formatting conventions

Loaded automatically when the `@docs-writer` agent writes or updates docs pages.
