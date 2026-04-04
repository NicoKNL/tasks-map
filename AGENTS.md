# AGENTS.md

## Project Overview

Tasks Map is an Obsidian plugin that visualizes tasks as an interactive graph.
Built with TypeScript, React 19, ReactFlow, and i18next. Bundled with esbuild
to CommonJS. The Obsidian API is external (not bundled).

## Commands

| Command                 | Purpose                                                |
| ----------------------- | ------------------------------------------------------ |
| `npm run dev`           | Watch mode development build                           |
| `npm run build`         | Typecheck (`tsc --noEmit`) + production esbuild bundle |
| `npm test`              | Run all Jest tests                                     |
| `npm run test:watch`    | Run tests in watch mode                                |
| `npm run test:coverage` | Run tests with coverage report                         |
| `npm run lint`          | ESLint check on `src/`                                 |
| `npm run lint:fix`      | ESLint autofix                                         |
| `npm run format`        | Prettier check                                         |
| `npm run format:fix`    | Prettier autofix                                       |

### Running a single test

```sh
npx jest test/task-factory.test.ts          # single file
npx jest -t "extracts emoji-format ID"      # by test name pattern
npx jest test/filter-tasks.test.ts -t "tag" # file + name pattern
```

## Project Structure

```
src/
├── main.tsx                 # Plugin entry point (extends Obsidian Plugin)
├── components/              # React UI components (task-node, star-button, etc.)
├── contexts/                # React contexts (AppContext, TagsContext)
├── hooks/                   # Custom hooks (useApp, useSummaryRenderer)
├── i18n/                    # i18next setup + locales (en, nl, zh-CN)
├── lib/                     # Pure business logic (task-factory, filter, utils)
├── settings/                # Obsidian settings tab
├── types/                   # Type definitions (BaseTask, DataviewTask, NoteTask)
└── views/                   # Obsidian ItemView wrappers for the React graph
test/
├── *.test.ts                # Unit tests (mirror src/lib/ and src/types/ names)
├── mocks/                   # Manual mocks for obsidian, react, reactflow, etc.
└── fixture/                 # Sample Obsidian vault for integration tests
```

## Code Style

### Formatting (Prettier)

- Double quotes everywhere (imports, strings, JSX).
- Semicolons always.
- Trailing commas in ES5 positions.
- 2-space indentation, 80-character line width.
- Arrow parens always: `(x) => ...`.
- LF line endings.

### Imports

Three-tier grouping (no blank lines between groups):

1. External libraries (`react`, `reactflow`, `obsidian`, `lucide-react`)
2. Internal absolute paths (`src/hooks/hooks`, `src/types/task`, `src/lib/utils`)
3. Relative paths (`./task-details`, `../i18n`)

Named imports are preferred. Default imports only for React, ReactFlow, and
primary component exports. Multi-symbol imports use destructured form with
trailing commas.

```typescript
import React, { useState, useCallback } from "react";
import { Handle, Position } from "reactflow";
import { useApp } from "src/hooks/hooks";
import { BaseTask } from "src/types/task";
import { TaskDetails } from "./task-details";
```

### Types

- `interface` for object shapes and component props.
- `type` for unions, aliases, and generic wrappers.
- Props interfaces: `ComponentNameProps` (e.g., `StarButtonProps`).
- Explicit return types only when non-obvious (abstract methods, hooks with
  specific return types, `void` returns in settings). Otherwise rely on
  inference.
- Prefix unused parameters with underscore: `_app`, `_newStatus`.

```typescript
interface TaskNodeData { ... }               // object shape
type TaskStatus = "todo" | "in_progress" | "canceled" | "done";  // union
type TaskNode = Node<TaskNodeData, "task">;   // generic alias
```

### Naming Conventions

| Kind                        | Convention              | Examples                                       |
| --------------------------- | ----------------------- | ---------------------------------------------- |
| Variables, functions, hooks | camelCase               | `filterState`, `useApp`, `handleDeleteTask`    |
| Classes                     | PascalCase              | `TaskFactory`, `BaseTask`, `NoteTask`          |
| React components            | PascalCase              | `TaskNode`, `StarButton`, `GuiOverlay`         |
| Interfaces, types           | PascalCase              | `FilterState`, `TasksMapSettings`              |
| Constants, regex patterns   | UPPER_CASE              | `VIEW_TYPE`, `DEFAULT_SETTINGS`, `TAG_PATTERN` |
| Files                       | kebab-case              | `task-node.tsx`, `filter-tasks.ts`             |
| View files (exception)      | PascalCase              | `TaskMapGraphView.tsx`                         |
| Test files                  | kebab-case + `.test.ts` | `task-factory.test.ts`                         |

### Exports

- At most one `default` export per file for the primary component or class.
- Named exports for everything else (types, constants, utilities, small
  components).

### React Patterns

- Functional components only. No class-based React components.
- `useCallback` for all handlers passed as props or in dependency arrays.
- `useMemo` for computed values and context provider values.
- `useEffect` with explicit dependency arrays for side effects.
- State management via `useState` + React Context. No external state library.
- Inline `style` props are forbidden (ESLint rule). Use CSS classes in
  `global.css`.

### Error Handling

- Optimistic UI updates with rollback in `catch` blocks for vault operations.
- Guard clauses with early `return` instead of nested conditionals.
- `throw new Error("descriptive message")` for validation errors.
- `async`/`await` always. Never use `.then()` chains.
- Bare `catch {}` (no error parameter) when the error object is unused.

### `any` Usage

`any` is forbidden by ESLint (`@typescript-eslint/no-explicit-any: error`).
When required for Obsidian API interop, use a targeted disable comment:

```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dataviewPlugin = (app as any).plugins?.plugins?.["dataview"];
```

### Internationalization

All user-facing strings must use the `t()` function from `src/i18n`.
Translation keys live in `src/i18n/locales/{en,nl,zh-CN}.json`.

## Testing

- Framework: Jest + ts-jest, test environment: node.
- Test files live in `test/` and use relative imports (`../src/lib/...`).
- Use `describe`/`it` blocks with nested `describe` for logical grouping.
- Define local `makeTask()` factory helpers at the top of each test file
  to create task instances with sensible defaults and overrides.
- Use `it.each` for parameterized tests.
- Test edge cases in dedicated `describe("edge cases", ...)` blocks.
- Manual mocks in `test/mocks/` handle obsidian, react, reactflow, and
  other browser-only dependencies.

## Architecture Notes

- Domain model: `BaseTask` (abstract) with subclasses `DataviewTask` and
  `NoteTask`. Task creation goes through `TaskFactory.parse()`.
- Business logic is in `src/lib/` as pure functions and classes, separate
  from React components.
- The plugin entry point (`src/main.tsx`) registers a custom Obsidian view,
  settings tab, command, and ribbon icon.
- Obsidian, electron, and CodeMirror packages are externalized in the
  esbuild config — never bundle them.
