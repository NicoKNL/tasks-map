# Settings

Access the settings through **Obsidian Settings → Community plugins → Tasks Map**.

## Language

Choose the display language for the plugin interface.

| Option                        | Description                    |
| ----------------------------- | ------------------------------ |
| English                       | Default language               |
| Nederlands (Dutch)            | Dutch translation              |
| 简体中文 (Simplified Chinese) | Simplified Chinese translation |

## Display Options

Toggle what information is shown on task nodes in the graph.

| Setting              | Default | Description                                     |
| -------------------- | ------- | ----------------------------------------------- |
| Show task priorities | On      | Display priority emoji indicators on task nodes |
| Show task tags       | On      | Display tags on task nodes                      |
| Show status counts   | On      | Display task completion status counts           |

## Layout

Control the visual arrangement of the graph.

| Setting           | Default    | Options                      | Description                                                                     |
| ----------------- | ---------- | ---------------------------- | ------------------------------------------------------------------------------- |
| Layout direction  | Horizontal | Horizontal, Vertical         | The direction of the graph layout                                               |
| Edge style        | Bezier     | Bezier, Straight, SmoothStep | The style of connections between task nodes                                     |
| SmoothStep radius | 10         | 0–100                        | Corner radius for SmoothStep edges (only visible when edge style is SmoothStep) |

## Tag Appearance

Customize how tags are colored in the graph.

### Random mode (default)

Each tag gets a unique color generated from a seed value. Change the seed to get a different color palette.

| Setting    | Default | Description                            |
| ---------- | ------- | -------------------------------------- |
| Color seed | 42      | Seed value for random color generation |

### Static mode

All tags share the same color.

| Setting | Default | Description                   |
| ------- | ------- | ----------------------------- |
| Color   | #3b82f6 | The color applied to all tags |

## Simple Task Relations

Choose how task dependencies are written in your notes.

| Style      | Description                        | Example                           |
| ---------- | ---------------------------------- | --------------------------------- |
| CSV        | Comma-separated list of task links | `🔗 task1, task2, task3`          |
| Individual | One link per line                  | `🔗 task1`<br>`🔗 task2`          |
| Dataview   | Dataview inline field              | `relation:: [[task1]], [[task2]]` |

## Advanced

| Setting             | Default | Description                                          |
| ------------------- | ------- | ---------------------------------------------------- |
| Debug visualization | Off     | Show debug overlays on the graph for troubleshooting |
