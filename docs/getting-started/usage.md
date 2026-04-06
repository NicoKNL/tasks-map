# Usage

## Opening the View

Open the Tasks Map view in one of two ways:

- Click the **map** icon in the left ribbon.
- Open the command palette (`Ctrl+P` / `Cmd+P`) and run **Tasks Map: Open map view**.

The view opens in the main editor area and displays all tasks from your vault as an interactive graph.

## The Graph Canvas

Each task is represented as a node. Edges between nodes indicate task dependencies.

- **Drag nodes** to rearrange them on the canvas.
- **Pan** by clicking and dragging the canvas background.
- **Zoom** with the scroll wheel or trackpad pinch.
- **Select a node** by clicking it.

## Task Node Actions

Each task node has several controls in its header:

| Control                     | Action                                    |
| --------------------------- | ----------------------------------------- |
| Status toggle (circle icon) | Toggle the task's completion status       |
| Star button                 | Mark or unmark the task as starred        |
| Link button                 | Open the task's source file in the editor |
| Menu button (⋮)             | Open the task context menu                |

### Task Context Menu

Click the **⋮** button on a node to open the context menu:

| Action      | Description                                                                                                                                  |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Create task | Open the Tasks plugin modal to create a new child task (requires the [Tasks](https://github.com/obsidian-tasks-group/obsidian-tasks) plugin) |
| Edit task   | Open the Tasks plugin modal to edit the task in place (requires the Tasks plugin)                                                            |
| Delete task | Remove the task from the vault                                                                                                               |

### Tags on Nodes

When **Show task tags** is enabled in settings, each node displays its tags. You can:

- **Remove a tag** by clicking the × on a tag chip.
- **Add a tag** by clicking the **+ Add tag** button and typing a tag name.

## Edge Actions

Click an edge to select it. Press `Backspace` or `Delete` to remove the selected edge. Deleting an edge removes the corresponding dependency reference from both tasks in the vault.

## The Filter Panel

The filter panel sits on the right side of the canvas. Click the **chevron** button (‹) to minimize it; click again to expand it.

### Search

Type in the search bar to find tasks by summary, ID, or tag. As you type, a suggestion list appears with up to eight matching tasks.

**Keyboard shortcuts in the search bar:**

| Key       | Action                                                                |
| --------- | --------------------------------------------------------------------- |
| `↓` / `↑` | Navigate suggestions                                                  |
| `Enter`   | Confirm selection or submit the current query                         |
| `Escape`  | Dismiss suggestions (or clear the search if no suggestions are shown) |

Click the **×** button to clear the current search.

When a search returns results, two checkboxes appear below the result count:

| Checkbox          | Description                                                   |
| ----------------- | ------------------------------------------------------------- |
| Show dependencies | Also show tasks that the matched tasks depend on (upstream)   |
| Show dependents   | Also show tasks that depend on the matched tasks (downstream) |

Both checkboxes can be active at the same time.

### Filters

| Filter             | Description                                                                                            |
| ------------------ | ------------------------------------------------------------------------------------------------------ |
| Status             | Multi-select dropdown — show only tasks with the selected statuses (todo, in progress, done, canceled) |
| Include labels     | Multi-select tag filter — show only tasks that have at least one of the selected tags                  |
| Exclude labels     | Multi-select tag filter — hide tasks that have any of the selected tags                                |
| Files / Folders    | Multi-select dropdown — show only tasks from the selected files or folders                             |
| Only starred       | Checkbox — show only tasks that have been starred                                                      |
| Hide tags on nodes | Checkbox — hide tag chips on all nodes (only visible when **Show task tags** is enabled in settings)   |

### Reload Tasks

Click **Reload Tasks** to re-read all tasks from the vault. Use this after making changes to notes outside the graph view.

You can also embed a Tasks Map directly in a note — see [Embedding a Tasks Map](embedding.md).
