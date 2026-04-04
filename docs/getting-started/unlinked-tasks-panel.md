# Unlinked Tasks Panel

## What are unlinked tasks?

A task is considered **unlinked** when it has no connections to any other task — it neither depends on anything nor is depended on by anything. Tasks Map moves these tasks into a dedicated **Unlinked Tasks** panel on the left side of the view so they do not clutter the graph canvas.

From the panel you can browse them, search, and drag any task onto the canvas when you are ready to work with it.

## Collapsing and expanding the panel

Click the **chevron** button in the panel header to collapse it to a narrow strip along the left edge. Click it again to expand the panel back to full width.

## Filtering tasks in the panel

Type in the search field at the top of the panel to filter by task text or tags. Clear the input to return to the full list.

!!! note
    The panel search is independent of the right-side filter panel. The status, tag, and file filters there have no effect on which tasks appear here.

## Dragging a task onto the graph

1. Find the task in the panel list.
2. Drag it onto the graph canvas and drop it where you want the node to appear.

Once dropped, the task is removed from the panel and placed on the canvas. This placement lasts for the current session — if the task still has no connections when you reload, it returns to the panel.

## Making a task permanently part of the graph

To keep a task on the canvas after reloading, connect it to at least one other task:

1. Hover over the task node until the connection handles appear.
2. Drag from a handle to another node to create an edge.

Once a task has at least one connection, it is no longer unlinked and stays on the canvas permanently.
