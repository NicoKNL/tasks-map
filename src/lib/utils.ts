import dagre from "@dagrejs/dagre";
import { App, TFile, Vault } from "obsidian";
import { Task, TaskStatus, TaskNode, TaskEdge, RawTask } from "src/types/task";
import { NODEHEIGHT, NODEWIDTH } from "src/components/task-node";
import { TaskFactory } from "./task-factory";
import { Position, Node, Edge } from "reactflow";
import {
  EMOJI_ID_REMOVAL,
  DATAVIEW_ID_REMOVAL,
  TAG_REMOVAL,
  WHITESPACE_NORMALIZE,
} from "./task-regex";

const statusSymbols = {
  todo: "[ ]",
  in_progress: "[/]",
  canceled: "[-]",
  done: "[x]",
};

const validDateTypes = [
  "due",
  "done",
  "start",
  "scheduled",
  "created",
  "canceled",
];

const dataSymbols: Record<string, Record<string, string>> = {
  due: {
    emoji: "📅",
    dataview: "due",
  },
  done: {
    emoji: "✅",
    dataview: "completion",
  },
  start: {
    emoji: "🛫",
    dataview: "start",
  },
  scheduled: {
    emoji: "⏳",
    dataview: "scheduled",
  },
  created: {
    emoji: "➕",
    dataview: "created",
  },
  canceled: {
    emoji: "❌",
    dataview: "canceled",
  },
};

const formatPatterns: Record<string, Record<string, RegExp>> = {
  due: {
    emoji: /📅\s+[^\s]+/g,
    dataview: /\[\[due::[^\]]+\]\]/g,
  },
  done: {
    emoji: /✅\s+[^\s]+/g,
    dataview: /\[\[completion::[^\]]+\]\]/g,
  },
  start: {
    emoji: /⏳\s+[^\s]+/g,
    dataview: /\[\[start::[^\]]+\]\]/g,
  },
  scheduled: {
    emoji: /🕐\s+[^\s]+/g,
    dataview: /\[\[scheduled::[^\]]+\]\]/g,
  },
  created: {
    emoji: /➕\s+[^\s]+/g,
    dataview: /\[\[created::[^\]]+\]\]/g,
  },
  canceled: {
    emoji: /❌\s+[^\s]+/g,
    dataview: /\[\[canceled::[^\]]+\]\]/g,
  },
};

/**
 * Estimates the dimensions of a node based on its task content.
 * Takes into account summary length and number of tags.
 */
export function estimateNodeDimensions(
  task: Task,
  showTags: boolean = true
): { width: number; height: number } {
  // Base dimensions
  const baseWidth = NODEWIDTH; // 250px
  const baseHeight = 60; // Minimum height for header (status, priority, buttons)

  // Estimate height based on summary length
  // Node inner width is ~226px (250 - 24px padding), average char width ~7px = ~32 chars per line
  // But with icons and buttons taking space, effective is lower
  const charsPerLine = 24;
  const lineHeight = 22; // Slightly more than font size for line spacing
  const summaryLines = Math.ceil(task.summary.length / charsPerLine);
  const summaryHeight = Math.max(1, summaryLines) * lineHeight;

  // Estimate height for tags (each row of tags is ~28px, ~3 tags per row)
  let tagsHeight = 0;
  if (showTags && task.tags.length > 0) {
    const tagsPerRow = 3;
    const tagRows = Math.ceil((task.tags.length + 1) / tagsPerRow); // +1 for "Add tag" button
    tagsHeight = tagRows * 28;
  }

  // Add padding and safety margin
  const padding = 24; // 12px top + 12px bottom
  const safetyMargin = 16; // Extra buffer to prevent overlap

  const totalHeight =
    baseHeight + summaryHeight + tagsHeight + padding + safetyMargin;

  return {
    width: baseWidth,
    height: Math.max(NODEHEIGHT, totalHeight),
  };
}

/**
 * Find the index of a task line in an array of lines by its ID.
 * Supports both emoji format (🆔 abc123) and Dataview format ([[id:: abc123]])
 */
function findTaskLineByIdOrText(
  lines: string[],
  taskId: string,
  taskText: string
): number {
  // Try to find by emoji format ID
  let taskLineIdx = lines.findIndex((line: string) =>
    line.includes(`🆔 ${taskId}`)
  );

  if (taskLineIdx !== -1) return taskLineIdx;

  // Try to find by Dataview format ID
  taskLineIdx = lines.findIndex((line: string) =>
    line.includes(`[[id:: ${taskId}]]`)
  );

  if (taskLineIdx !== -1) return taskLineIdx;

  // Fallback: try to find by matching the task text (legacy format)
  taskLineIdx = lines.findIndex((line: string) => line.includes(taskText));

  return taskLineIdx;
}

export async function updateTaskStatusInVault(
  task: Task,
  newStatus: TaskStatus,
  app: App
): Promise<void> {
  if (!task.link || !task.text) return;
  const vault = app?.vault;
  if (!vault) return;
  const file = vault.getFileByPath(task.link);
  if (!file) return;

  // Handle note-based tasks differently (they use frontmatter)
  if (task.type === "note") {
    await vault.process(file, (fileContent) => {
      const lines = fileContent.split(/\r?\n/);

      // Find frontmatter boundaries
      let frontmatterStart = -1;
      let frontmatterEnd = -1;

      if (lines[0] === "---") {
        frontmatterStart = 0;
        for (let i = 1; i < lines.length; i++) {
          if (lines[i] === "---") {
            frontmatterEnd = i;
            break;
          }
        }
      }

      if (frontmatterStart === -1 || frontmatterEnd === -1) {
        return fileContent;
      }

      // Map TaskStatus to note-based status format
      const noteStatus =
        newStatus === "todo"
          ? "open"
          : newStatus === "done"
            ? "done"
            : newStatus === "in_progress"
              ? "in-progress"
              : newStatus === "canceled"
                ? "canceled"
                : "open";

      // Find and update status line
      for (let i = frontmatterStart + 1; i < frontmatterEnd; i++) {
        if (lines[i].startsWith("status:")) {
          lines[i] = `status: ${noteStatus}`;
          break;
        }
      }

      return lines.join("\n");
    });
    return;
  }

  // Handle dataview tasks (inline status)
  await vault.process(file, (fileContent) => {
    const lines = fileContent.split(/\r?\n/);
    const taskLineIdx = findTaskLineByIdOrText(lines, task.id, task.text);

    if (taskLineIdx === -1) return fileContent;

    // TODO: Verify if the escape is really useless here (or change this parsing completely). It was added by the linter, but it seems necessary for correct regex.
    lines[taskLineIdx] = lines[taskLineIdx].replace(
      /\[([ x/\-])\]/, // eslint-disable-line no-useless-escape
      statusSymbols[newStatus]
    );

    // Add done timestamp
    if (newStatus === "done") {
      lines[taskLineIdx] = addDateToTask(
        lines[taskLineIdx],
        "done",
        getTodayDate()
      );
    }
    // Delete done timestamp and add start timestamp
    else if (newStatus === "in_progress") {
      lines[taskLineIdx] = removeDateFromTask(lines[taskLineIdx], "done");
      lines[taskLineIdx] = addDateToTask(
        lines[taskLineIdx],
        "start",
        getTodayDate()
      );
    }
    // Delete canceled and done timestamp
    else if (newStatus === "todo") {
      lines[taskLineIdx] = removeDateFromTask(lines[taskLineIdx], "canceled");
      lines[taskLineIdx] = removeDateFromTask(lines[taskLineIdx], "done");
      lines[taskLineIdx] = removeDateFromTask(lines[taskLineIdx], "start");
    }

    return lines.join("\n");
  });
}

export async function deleteTaskFromVault(task: Task, app: App): Promise<void> {
  if (!task.link) return;
  const vault = app?.vault;
  if (!vault) return;
  const file = vault.getFileByPath(task.link);
  if (!file) return;

  // Handle note-based tasks (delete the entire file)
  if (task.type === "note") {
    await vault.delete(file);
    return;
  }

  // Handle dataview tasks (remove the task line)
  await vault.process(file, (fileContent) => {
    const lines = fileContent.split(/\r?\n/);
    const taskLineIdx = findTaskLineByIdOrText(lines, task.id, task.text);

    if (taskLineIdx === -1) return fileContent;

    // Remove the task line
    lines.splice(taskLineIdx, 1);
    return lines.join("\n");
  });
}

/**
 * Adds or updates a date value in a task line, supporting multiple formats.
 * Supports: Tasks plugin format (due:2023-10-05), emoji format (⏳ 2023-10-05),
 * Dataview format ([[due::2023-10-05]]), and CSV format (📅2023-10-05)
 *
 * @param {string} taskLine - The original task line string
 * @param {string} dateType - The type of date to add/update ('due', 'done', 'start', 'scheduled', 'created')
 * @param {string} date - The date string to add (formatted as YYYY-MM-DD or relative date like 'today')
 * @returns {string} The modified task line with the new/updated date
 * @throws {Error} If dateType is invalid or taskLine is empty
 */
function addDateToTask(
  taskLine: string,
  dateType: string,
  date: string
): string {
  if (!taskLine || taskLine.trim() === "") {
    throw new Error("Task line cannot be empty");
  }

  if (!validDateTypes.includes(dateType)) {
    throw new Error(
      `Invalid date type: ${dateType}. Must be one of: ${validDateTypes.join(", ")}`
    );
  }

  // First remove existing date of the same type in all formats
  const cleanedLine = removeDateFromTask(taskLine, dateType);

  const mappings = dataSymbols[dateType];
  if (!mappings) {
    throw new Error(`No format mappings found for date type: ${dateType}`);
  }

  // Determine existing formats in the line to decide which format to use
  const existingFormats = detectExistingFormats(cleanedLine);

  // Choose format based on existing formats or default to tasks format
  let newDateTag = "";
  if (existingFormats === "dataview") {
    newDateTag = ` [[${mappings.dataview}::${date}]]`;
  } else {
    newDateTag = ` ${mappings.emoji} ${date}`;
  }

  // Add the new date tag before any existing tags (which typically appear at the end)
  const tagRegex =
    /(\s+(?:[^\s]+:[^\s]+|\[\[[^\]]+\]\]|[\u{1F300}-\u{1FAFF}]\s+[^\s]+))+$/u;
  const tagMatch = cleanedLine.match(tagRegex);

  if (tagMatch) {
    // Insert new date before existing tags
    return cleanedLine.replace(tagRegex, newDateTag + tagMatch[0]);
  } else {
    // No existing tags, add to the end
    return cleanedLine + newDateTag;
  }
}

/**
 * Removes a date of a specified type from a task line, supporting all formats.
 *
 * @param {string} taskLine - The original task line string
 * @param {string} dateType - The type of date to remove ('due', 'done', 'start', 'scheduled', 'created')
 * @returns {string} The modified task line without the specified date type
 * @throws {Error} If dateType is invalid
 */
function removeDateFromTask(taskLine: string, dateType: string): string {
  if (!validDateTypes.includes(dateType)) {
    throw new Error(
      `Invalid date type: ${dateType}. Must be one of: ${validDateTypes.join(", ")}`
    );
  }

  if (!taskLine || taskLine.trim() === "") {
    return taskLine;
  }

  const patterns = formatPatterns[dateType];
  if (!patterns) {
    throw new Error(`No patterns found for date type: ${dateType}`);
  }

  let result = taskLine;

  // Remove all formats of the specified date type
  for (const [, pattern] of Object.entries(patterns)) {
    result = result.replace(pattern, "");
  }

  // Special handling for CSV format with multiple dates
  const csvPattern = new RegExp(`\\s+${dateType}:[^\\s]+(,[^\\s]+)*`, "g");
  result = result.replace(csvPattern, "");

  // Clean up any double spaces that might result from removal
  result = result.replace(/\s+/g, " ").trim();

  // Remove any leftover commas from CSV format
  result = result.replace(/(\s*,\s*){2,}/g, ", ");
  result = result.replace(/^\s*,\s*|\s*,\s*$/g, "");

  return result;
}

/**
 * Detects which date formats are already present in a task line.
 *
 * @param {string} taskLine - The task line to analyze
 * @returns {Set<string>} Set of detected formats ('emoji', 'dataview')
 */
function detectExistingFormats(taskLine: string): string {
  let detectedFormats = "emoji";

  // Check for Dataview formats
  const dataviewRegex = /\[\[[^\]]+::[^\]]+\]\]/g;
  if (dataviewRegex.test(taskLine)) {
    detectedFormats = "dataview";
  }

  return detectedFormats;
}

/**
 * Gets today's date in YYYY-MM-DD format (most common in Obsidian tasks)
 * @returns {string} Today's date formatted as YYYY-MM-DD
 */
function getTodayDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0"); // Month is 0-indexed
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export async function removeTagFromTaskInVault(
  task: Task,
  tagToRemove: string,
  app: App
): Promise<void> {
  if (!task.link || !task.text) return;
  const vault = app?.vault;
  if (!vault) return;
  const file = vault.getFileByPath(task.link);
  if (!file) return;

  // Handle note-based tasks differently (they use frontmatter)
  if (task.type === "note") {
    await vault.process(file, (fileContent) => {
      const lines = fileContent.split(/\r?\n/);

      // Find frontmatter boundaries
      let frontmatterStart = -1;
      let frontmatterEnd = -1;

      if (lines[0] === "---") {
        frontmatterStart = 0;
        for (let i = 1; i < lines.length; i++) {
          if (lines[i] === "---") {
            frontmatterEnd = i;
            break;
          }
        }
      }

      if (frontmatterStart === -1 || frontmatterEnd === -1) {
        return fileContent;
      }

      // Find and remove the tag from the tags array
      // Tags are stored as "  - tagname" under "tags:"
      let i = frontmatterStart + 1;
      while (i < frontmatterEnd) {
        const line = lines[i];
        if (line === "tags:") {
          // Found tags section, look for the tag in the following lines
          i++;
          while (i < frontmatterEnd && lines[i].match(/^\s{2}- /)) {
            const tagLine = lines[i];
            const tagMatch = tagLine.match(/^\s{2}- (.+)$/);
            if (tagMatch && tagMatch[1] === tagToRemove) {
              // Found the tag, remove it
              lines.splice(i, 1);
              frontmatterEnd--;
              break;
            }
            i++;
          }
          break;
        }
        i++;
      }

      return lines.join("\n");
    });
    return;
  }

  // Handle dataview tasks (inline tags)
  await vault.process(file, (fileContent) => {
    const lines = fileContent.split(/\r?\n/);

    let taskLineIdx = findTaskLineByIdOrText(lines, task.id, task.text);

    if (taskLineIdx === -1) {
      // Fallback: try to find by matching core task text (without tags/IDs)
      const coreTaskText = task.text
        .replace(EMOJI_ID_REMOVAL, "") // Remove emoji ID
        .replace(DATAVIEW_ID_REMOVAL, "") // Remove Dataview ID
        .replace(TAG_REMOVAL, "") // Remove tags
        .replace(WHITESPACE_NORMALIZE, " ") // Normalize whitespace
        .trim();

      taskLineIdx = lines.findIndex((line: string) => {
        const coreLineText = line
          .replace(EMOJI_ID_REMOVAL, "")
          .replace(DATAVIEW_ID_REMOVAL, "")
          .replace(TAG_REMOVAL, "")
          .replace(WHITESPACE_NORMALIZE, " ")
          .trim();
        return (
          coreLineText.includes(coreTaskText) ||
          coreTaskText.includes(coreLineText)
        );
      });

      if (taskLineIdx === -1) return fileContent;
    }

    // Remove the tag from the line
    const currentLine = lines[taskLineIdx];

    // Match tags in format #tag or #tag/subtag, with optional leading/trailing whitespace
    const tagPattern = new RegExp(
      `\\s*#${tagToRemove.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:/\\S*)?(?=\\s|$)`,
      "g"
    );

    const newLine = currentLine
      .replace(tagPattern, "")
      .replace(/\s+/g, " ")
      .trim();

    lines[taskLineIdx] = newLine;

    return lines.join("\n");
  });
}

export async function addStarToTaskInVault(
  task: Task,
  app: App
): Promise<void> {
  if (!task.link || !task.text) return;
  const vault = app?.vault;
  if (!vault) return;
  const file = vault.getFileByPath(task.link);
  if (!file) return;

  // Handle note-based tasks differently (they use frontmatter)
  if (task.type === "note") {
    await vault.process(file, (fileContent) => {
      const lines = fileContent.split(/\r?\n/);

      // Find frontmatter boundaries
      let frontmatterStart = -1;
      let frontmatterEnd = -1;

      if (lines[0] === "---") {
        frontmatterStart = 0;
        for (let i = 1; i < lines.length; i++) {
          if (lines[i] === "---") {
            frontmatterEnd = i;
            break;
          }
        }
      }

      if (frontmatterStart === -1 || frontmatterEnd === -1) {
        return fileContent;
      }

      // Check if starred field already exists
      let starredIndex = -1;
      for (let i = frontmatterStart + 1; i < frontmatterEnd; i++) {
        if (lines[i].match(/^starred:\s*/)) {
          starredIndex = i;
          break;
        }
      }

      if (starredIndex !== -1) {
        // Update existing starred field
        lines[starredIndex] = "starred: true";
      } else {
        // Add starred field after priority if it exists, otherwise before tags
        let insertIndex = frontmatterEnd;
        for (let i = frontmatterStart + 1; i < frontmatterEnd; i++) {
          if (lines[i].match(/^priority:\s*/)) {
            insertIndex = i + 1;
            break;
          }
        }
        lines.splice(insertIndex, 0, "starred: true");
      }

      return lines.join("\n");
    });
    return;
  }

  // Handle dataview tasks (inline star emoji)
  await vault.process(file, (fileContent) => {
    const lines = fileContent.split(/\r?\n/);
    const taskLineIdx = findTaskLineByIdOrText(lines, task.id, task.text);

    if (taskLineIdx === -1) return fileContent;

    // Check if star already exists
    if (lines[taskLineIdx].includes("⭐")) return fileContent;

    // Add star at the end of the line
    lines[taskLineIdx] = lines[taskLineIdx] + " ⭐";
    return lines.join("\n");
  });
}

export async function removeStarFromTaskInVault(
  task: Task,
  app: App
): Promise<void> {
  if (!task.link || !task.text) return;
  const vault = app?.vault;
  if (!vault) return;
  const file = vault.getFileByPath(task.link);
  if (!file) return;

  // Handle note-based tasks differently (they use frontmatter)
  if (task.type === "note") {
    await vault.process(file, (fileContent) => {
      const lines = fileContent.split(/\r?\n/);

      // Find frontmatter boundaries
      let frontmatterStart = -1;
      let frontmatterEnd = -1;

      if (lines[0] === "---") {
        frontmatterStart = 0;
        for (let i = 1; i < lines.length; i++) {
          if (lines[i] === "---") {
            frontmatterEnd = i;
            break;
          }
        }
      }

      if (frontmatterStart === -1 || frontmatterEnd === -1) {
        return fileContent;
      }

      // Find and update starred field
      for (let i = frontmatterStart + 1; i < frontmatterEnd; i++) {
        if (lines[i].match(/^starred:\s*/)) {
          lines[i] = "starred: false";
          break;
        }
      }

      return lines.join("\n");
    });
    return;
  }

  // Handle dataview tasks (inline star emoji)
  await vault.process(file, (fileContent) => {
    const lines = fileContent.split(/\r?\n/);
    const taskLineIdx = findTaskLineByIdOrText(lines, task.id, task.text);

    if (taskLineIdx === -1) return fileContent;

    // Remove star emoji
    lines[taskLineIdx] = lines[taskLineIdx].replace(/\s*⭐\s*/g, " ").trim();
    return lines.join("\n");
  });
}

export async function addTagToTaskInVault(
  task: Task,
  tagToAdd: string,
  app: App
): Promise<void> {
  if (!task.link || !task.text) return;
  const vault = app?.vault;
  if (!vault) return;
  const file = vault.getFileByPath(task.link);
  if (!file) return;

  // Handle note-based tasks differently (they use frontmatter)
  if (task.type === "note") {
    await vault.process(file, (fileContent) => {
      const lines = fileContent.split(/\r?\n/);

      // Find frontmatter boundaries
      let frontmatterStart = -1;
      let frontmatterEnd = -1;

      if (lines[0] === "---") {
        frontmatterStart = 0;
        for (let i = 1; i < lines.length; i++) {
          if (lines[i] === "---") {
            frontmatterEnd = i;
            break;
          }
        }
      }

      if (frontmatterStart === -1 || frontmatterEnd === -1) {
        return fileContent;
      }

      // Find the tags section and add the tag
      // Tags are stored as "  - tagname" under "tags:"
      let i = frontmatterStart + 1;
      let tagsIndex = -1;

      while (i < frontmatterEnd) {
        const line = lines[i];
        if (line === "tags:") {
          tagsIndex = i;
          // Check if tag already exists
          let j = i + 1;
          while (j < frontmatterEnd && lines[j].match(/^\s{2}- /)) {
            const tagLine = lines[j];
            const tagMatch = tagLine.match(/^\s{2}- (.+)$/);
            if (tagMatch && tagMatch[1] === tagToAdd) {
              // Tag already exists
              return fileContent;
            }
            j++;
          }
          // Add the tag after the last tag in the list
          lines.splice(j, 0, `  - ${tagToAdd}`);
          break;
        }
        i++;
      }

      // If no tags section exists, create one
      if (tagsIndex === -1) {
        lines.splice(frontmatterEnd, 0, "tags:", `  - ${tagToAdd}`);
      }

      return lines.join("\n");
    });
    return;
  }

  // Handle dataview tasks (inline tags)
  await vault.process(file, (fileContent) => {
    const lines = fileContent.split(/\r?\n/);
    let taskLineIdx = findTaskLineByIdOrText(lines, task.id, task.text);

    if (taskLineIdx === -1) {
      // Fallback: try to find by matching core task text (without tags/IDs)
      const coreTaskText = task.text
        .replace(EMOJI_ID_REMOVAL, "") // Remove emoji ID
        .replace(DATAVIEW_ID_REMOVAL, "") // Remove Dataview ID
        .replace(TAG_REMOVAL, "") // Remove tags
        .replace(WHITESPACE_NORMALIZE, " ") // Normalize whitespace
        .trim();

      taskLineIdx = lines.findIndex((line: string) => {
        const coreLineText = line
          .replace(EMOJI_ID_REMOVAL, "")
          .replace(DATAVIEW_ID_REMOVAL, "")
          .replace(TAG_REMOVAL, "")
          .replace(WHITESPACE_NORMALIZE, " ")
          .trim();
        return (
          coreLineText.includes(coreTaskText) ||
          coreTaskText.includes(coreLineText)
        );
      });

      if (taskLineIdx === -1) return fileContent;
    }

    // Add the tag to the end of the line
    const currentLine = lines[taskLineIdx];
    // Ensure the tag starts with # if it doesn't already
    const formattedTag = tagToAdd.startsWith("#") ? tagToAdd : `#${tagToAdd}`;
    lines[taskLineIdx] = currentLine.trim() + ` ${formattedTag}`;

    return lines.join("\n");
  });
}

export function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  direction: "Horizontal" | "Vertical" = "Horizontal",
  showTags: boolean = true
) {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  const rankdir = direction === "Horizontal" ? "LR" : "TB"; // LR = Left-to-Right, TB = Top-to-Bottom
  dagreGraph.setGraph({ rankdir, nodesep: 30, ranksep: 50 });

  // Store calculated dimensions for each node
  const nodeDimensions = new Map<string, { width: number; height: number }>();

  nodes.forEach((node) => {
    // Get task from node data to estimate dimensions
    const task = node.data?.task as Task | undefined;
    const dimensions = task
      ? estimateNodeDimensions(task, showTags)
      : { width: NODEWIDTH, height: NODEHEIGHT };

    nodeDimensions.set(node.id, dimensions);
    dagreGraph.setNode(node.id, dimensions);
  });
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });
  dagre.layout(dagreGraph);

  return nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const dimensions = nodeDimensions.get(node.id) || {
      width: NODEWIDTH,
      height: NODEHEIGHT,
    };

    if (!nodeWithPosition) {
      return {
        ...node,
        position: { x: 0, y: 0 },
      };
    } else {
      return {
        ...node,
        position: {
          // Center the node at the position dagre calculated
          x: nodeWithPosition.x - dimensions.width / 2,
          y: nodeWithPosition.y - dimensions.height / 2,
        },
      };
    }
  });
}

/**
 * Wrapper to add a shared hash to two tasks in their respective files, with different emojis.
 * @param vault Obsidian vault instance
 * @param fromTask The source task (will get 🆔 if it does not already have it)
 * @param toTask The target task (will get ⛔)
 * @returns Promise<string | undefined> The hash used if successful, false otherwise
 */
export async function addLinkSignsBetweenTasks(
  vault: Vault,
  fromTask: Task,
  toTask: Task,
  linkingStyle: "individual" | "csv" | "dataview" = "individual"
): Promise<string | undefined> {
  if (!fromTask.link || !toTask.link) return undefined;

  const id = fromTask.id;

  // Handle note-based tasks differently (they use frontmatter, not inline metadata)
  if (toTask.type === "note") {
    await addDependencyToNoteTask(vault, toTask, fromTask);
    return id + "-" + toTask.id;
  }

  // Handle dataview tasks (inline metadata)
  await addSignToTaskInFile(vault, fromTask, "id", id, linkingStyle);
  await addSignToTaskInFile(vault, toTask, "stop", id, linkingStyle);

  return id + "-" + toTask.id;
}

/**
 * Add a dependency to a note-based task by updating its frontmatter
 */
async function addDependencyToNoteTask(
  vault: Vault,
  toTask: Task,
  fromTask: Task
): Promise<void> {
  if (!toTask.link) return;
  const file = vault.getAbstractFileByPath(toTask.link);
  if (!(file instanceof TFile)) return;

  await vault.process(file, (fileContent) => {
    const lines = fileContent.split(/\r?\n/);

    // Find frontmatter boundaries
    let frontmatterStart = -1;
    let frontmatterEnd = -1;

    if (lines[0] === "---") {
      frontmatterStart = 0;
      for (let i = 1; i < lines.length; i++) {
        if (lines[i] === "---") {
          frontmatterEnd = i;
          break;
        }
      }
    }

    if (frontmatterStart === -1 || frontmatterEnd === -1) {
      return fileContent;
    }

    // Parse the frontmatter to find blockedBy section
    const frontmatterLines = lines.slice(frontmatterStart + 1, frontmatterEnd);
    let blockedByIndex = -1;
    const blockedByIndent = "  "; // Standard YAML indent

    for (let i = 0; i < frontmatterLines.length; i++) {
      if (frontmatterLines[i].match(/^blockedBy:\s*$/)) {
        blockedByIndex = i;
        break;
      }
    }

    // Check if this dependency already exists
    const taskIdentifier = `[[${fromTask.text}]]`;
    for (let i = frontmatterStart + 1; i < frontmatterEnd; i++) {
      if (lines[i].includes(`uid:`) && lines[i].includes(taskIdentifier)) {
        // Dependency already exists, don't add it again
        return fileContent;
      }
    }

    // Create the new dependency entry as two separate lines
    const uidLine = `${blockedByIndent}- uid: "${taskIdentifier}"`;
    const reltypeLine = `${blockedByIndent}  reltype: FINISHTOSTART`;

    if (blockedByIndex === -1) {
      // No blockedBy field exists, add it before the closing ---
      lines.splice(frontmatterEnd, 0, "blockedBy:", uidLine, reltypeLine);
    } else {
      // blockedBy exists, find where to insert (after the last blockedBy item)
      let insertIndex = frontmatterStart + 1 + blockedByIndex + 1;

      // Find the end of the blockedBy list
      while (insertIndex < frontmatterStart + 1 + frontmatterLines.length) {
        const line = lines[insertIndex];
        if (line.match(/^\s{2}- uid:/)) {
          insertIndex++;
          // Skip the reltype line
          if (
            insertIndex < lines.length &&
            lines[insertIndex].match(/^\s{4}reltype:/)
          ) {
            insertIndex++;
          }
        } else {
          break;
        }
      }

      lines.splice(insertIndex, 0, uidLine, reltypeLine);
    }

    return lines.join("\n");
  });
}

/**
 * Modifies a task in its linked file by searching for the task text and replacing it with a new version
 * that adds a stop sign (⛔) or ID sign (🆔) with the provided 6-char hash.
 * @param vault: Obsidian vault instance
 * @param task: The task object (must have .link and .text)
 * @param type: 'stop' | 'id' - which sign to add
 * @param hash: The hash string to use
 */
export async function addSignToTaskInFile(
  vault: Vault,
  task: Task,
  type: "stop" | "id",
  hash: string,
  linkingStyle: "individual" | "csv" | "dataview" = "individual"
): Promise<void> {
  if (!task.link || !task.text) return;
  const file = vault.getAbstractFileByPath(task.link);
  if (!(file instanceof TFile)) return;

  await vault.process(file, (fileContent) => {
    const lines = fileContent.split(/\r?\n/);
    const taskLineIdx = lines.findIndex((line) => line.includes(task.text));
    if (taskLineIdx === -1) return fileContent;

    if (type === "id") {
      // Check if any ID format is already present
      const emojiIdPresent = /🆔\s*[a-zA-Z0-9]{6}/.test(lines[taskLineIdx]);
      const dataviewIdPresent = /\[\[id::\s*[a-zA-Z0-9]{6}\]\]/.test(
        lines[taskLineIdx]
      );

      if (emojiIdPresent || dataviewIdPresent) return fileContent;

      // Add ID in the configured format
      if (linkingStyle === "dataview") {
        const sign = `[[id:: ${hash}]]`;
        if (lines[taskLineIdx].includes(sign)) return fileContent;
        lines[taskLineIdx] = lines[taskLineIdx] + " " + sign;
      } else {
        // Default to emoji format for individual and csv styles
        const sign = `🆔 ${hash}`;
        if (lines[taskLineIdx].includes(sign)) return fileContent;
        lines[taskLineIdx] = lines[taskLineIdx] + " " + sign;
      }
    } else if (type === "stop") {
      // Detect if task is using Dataview format (or if it's the configured style)
      const usesDataviewFormat =
        linkingStyle === "dataview" ||
        /\[\[id::\s*[a-zA-Z0-9]{6}\]\]/.test(lines[taskLineIdx]) ||
        /\[\[dependsOn::\s*[a-zA-Z0-9]{6}(?:,\s*[a-zA-Z0-9]{6})*\]\]/.test(
          lines[taskLineIdx]
        );

      if (usesDataviewFormat) {
        // Handle Dataview format dependencies
        const dataviewRegex =
          /\[\[dependsOn::\s*([a-zA-Z0-9]{6}(?:,\s*[a-zA-Z0-9]{6})*)\]\]/;
        const dataviewMatch = lines[taskLineIdx].match(dataviewRegex);

        if (dataviewMatch) {
          // Append to existing Dataview dependencies list if hash not already present
          const existingIds = dataviewMatch[1]
            .split(",")
            .map((id) => id.trim());
          if (!existingIds.includes(hash)) {
            const newList = [...existingIds, hash].join(", ");
            lines[taskLineIdx] = lines[taskLineIdx].replace(
              dataviewRegex,
              `[[dependsOn:: ${newList}]]`
            );
          }
        } else {
          // No existing Dataview dependencies, add new one
          lines[taskLineIdx] = lines[taskLineIdx] + ` [[dependsOn:: ${hash}]]`;
        }
      } else {
        // Handle emoji format stop signs based on linking style
        if (linkingStyle === "csv") {
          // Check if there's already a CSV-style stop sign
          const csvRegex = /⛔\s*([a-zA-Z0-9]{6}(?:,[a-zA-Z0-9]{6})*)/;
          const csvMatch = lines[taskLineIdx].match(csvRegex);

          if (csvMatch) {
            // Append to existing CSV list if hash not already present
            const existingIds = csvMatch[1].split(",").map((id) => id.trim());
            if (!existingIds.includes(hash)) {
              const newCsvList = [...existingIds, hash].join(",");
              lines[taskLineIdx] = lines[taskLineIdx].replace(
                csvRegex,
                `⛔ ${newCsvList}`
              );
            }
          } else {
            // Check for individual style stop signs and convert to CSV
            const individualRegex = /⛔\s*([a-zA-Z0-9]{6})/g;
            const individualMatches = Array.from(
              lines[taskLineIdx].matchAll(individualRegex)
            );

            if (individualMatches.length > 0) {
              // Convert existing individual signs to CSV format
              const existingIds = individualMatches.map((match) => match[1]);
              if (!existingIds.includes(hash)) {
                existingIds.push(hash);
              }

              // Remove all individual stop signs
              let updatedLine = lines[taskLineIdx];
              individualMatches.forEach((match) => {
                updatedLine = updatedLine.replace(match[0], "");
              });

              // Add single CSV-style stop sign
              updatedLine = updatedLine.trim() + ` ⛔ ${existingIds.join(",")}`;
              lines[taskLineIdx] = updatedLine;
            } else {
              // No existing stop signs, add new CSV-style (single item)
              lines[taskLineIdx] = lines[taskLineIdx] + ` ⛔ ${hash}`;
            }
          }
        } else {
          // Individual style - add individual stop sign
          const sign = `⛔ ${hash}`;
          if (lines[taskLineIdx].includes(sign)) return fileContent;
          lines[taskLineIdx] = lines[taskLineIdx] + " " + sign;
        }
      }
    }

    return lines.join("\n");
  });
}

// Remove a link hash from both source and target tasks in their files
export async function removeLinkSignsBetweenTasks(
  vault: Vault,
  toTask: Task,
  hash: string
): Promise<void> {
  if (!toTask.link) return;

  // Handle note-based tasks differently
  if (toTask.type === "note") {
    await removeDependencyFromNoteTask(vault, toTask, hash);
    return;
  }

  await removeSignFromTaskInFile(vault, toTask, "stop", hash);
}

/**
 * Remove a dependency from a note-based task by updating its frontmatter
 */
async function removeDependencyFromNoteTask(
  vault: Vault,
  toTask: Task,
  fromTaskId: string
): Promise<void> {
  if (!toTask.link) return;
  const file = vault.getAbstractFileByPath(toTask.link);
  if (!(file instanceof TFile)) return;

  await vault.process(file, (fileContent) => {
    const lines = fileContent.split(/\r?\n/);

    // Find frontmatter boundaries
    let frontmatterStart = -1;
    let frontmatterEnd = -1;

    if (lines[0] === "---") {
      frontmatterStart = 0;
      for (let i = 1; i < lines.length; i++) {
        if (lines[i] === "---") {
          frontmatterEnd = i;
          break;
        }
      }
    }

    if (frontmatterStart === -1 || frontmatterEnd === -1) {
      return fileContent;
    }

    // Find and remove the dependency entry
    // The fromTaskId is a file path like "TaskNotes/Tasks/Example task 1.md"
    // We need to extract the basename
    const basename = fromTaskId.replace(/\.md$/, "").split("/").pop();

    let i = frontmatterStart + 1;
    while (i < frontmatterEnd) {
      const line = lines[i];
      // Match uid lines with any amount of leading whitespace (to handle malformed indentation)
      if (line.match(/^\s*- uid:/) && line.includes(`[[${basename}]]`)) {
        // Found the entry, remove it and the next reltype line
        lines.splice(i, 1);
        // Also check for reltype with any amount of leading whitespace
        if (i < lines.length && lines[i].match(/^\s*reltype:/)) {
          lines.splice(i, 1);
        }
        frontmatterEnd -= 2; // Adjust end index after removal
      } else {
        i++;
      }
    }

    return lines.join("\n");
  });
}

export async function removeSignFromTaskInFile(
  vault: Vault,
  task: Task,
  type: "stop" | "id",
  hash: string
): Promise<void> {
  if (!task.link || !task.text) return;
  const file = vault.getAbstractFileByPath(task.link);
  if (!(file instanceof TFile)) return;

  await vault.process(file, (fileContent) => {
    const lines = fileContent.split(/\r?\n/);
    const taskLineIdx = lines.findIndex((line) => line.includes(task.text));
    if (taskLineIdx === -1) return fileContent;

    if (type === "id") {
      // Remove emoji ID sign
      const emojiSign = `🆔 ${hash}`;
      if (lines[taskLineIdx].includes(emojiSign)) {
        lines[taskLineIdx] = lines[taskLineIdx]
          .replace(emojiSign, "")
          .replace(/\s+$/, "");
        return lines.join("\n");
      }

      // Remove Dataview ID sign
      const dataviewSign = `[[id:: ${hash}]]`;
      if (lines[taskLineIdx].includes(dataviewSign)) {
        lines[taskLineIdx] = lines[taskLineIdx]
          .replace(dataviewSign, "")
          .replace(/\s+$/, "");
      }
    } else if (type === "stop") {
      // First try Dataview format
      const dataviewRegex =
        /\[\[dependsOn::\s*([a-zA-Z0-9]{6}(?:,\s*[a-zA-Z0-9]{6})*)\]\]/;
      const dataviewMatch = lines[taskLineIdx].match(dataviewRegex);

      if (dataviewMatch) {
        const existingIds = dataviewMatch[1].split(",").map((id) => id.trim());
        const filteredIds = existingIds.filter((id) => id !== hash);

        if (filteredIds.length === 0) {
          // Remove entire Dataview block if no IDs left
          lines[taskLineIdx] = lines[taskLineIdx]
            .replace(dataviewMatch[0], "")
            .replace(/\s+$/, "");
        } else if (filteredIds.length !== existingIds.length) {
          // Update Dataview with remaining IDs
          const newList = filteredIds.join(", ");
          lines[taskLineIdx] = lines[taskLineIdx].replace(
            dataviewRegex,
            `[[dependsOn:: ${newList}]]`
          );
        }
      } else {
        // Try emoji CSV format
        const csvRegex = /⛔\s*([a-zA-Z0-9]{6}(?:,[a-zA-Z0-9]{6})*)/;
        const csvMatch = lines[taskLineIdx].match(csvRegex);

        if (csvMatch) {
          const existingIds = csvMatch[1].split(",").map((id) => id.trim());
          const filteredIds = existingIds.filter((id) => id !== hash);

          if (filteredIds.length === 0) {
            // Remove entire CSV block if no IDs left
            lines[taskLineIdx] = lines[taskLineIdx]
              .replace(csvMatch[0], "")
              .replace(/\s+$/, "");
          } else if (filteredIds.length !== existingIds.length) {
            // Update CSV with remaining IDs
            const newCsvList = filteredIds.join(",");
            lines[taskLineIdx] = lines[taskLineIdx].replace(
              csvRegex,
              `⛔ ${newCsvList}`
            );
          }
        } else {
          // Try individual emoji format
          const sign = `⛔ ${hash}`;
          if (lines[taskLineIdx].includes(sign)) {
            lines[taskLineIdx] = lines[taskLineIdx]
              .replace(sign, "")
              .replace(/\s+$/, "");
          }
        }
      }
    }

    return lines.join("\n");
  });
}

// TODO: Improve typing for app parameter
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getAllTasks(app: any): Task[] {
  // Central function to gather tasks from all available sources
  const allTasks: Task[] = [];

  // Source 1: Dataview plugin tasks
  allTasks.push(...getAllDataviewTasks(app));

  // Source 2: Note-based tasks (notes with #task in frontmatter)
  allTasks.push(...getNoteTasks(app));

  return allTasks;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getAllDataviewTasks(app: any): Task[] {
  let tasks: RawTask[] = [];

  // plugins exists, just not on the Obsidian App API?:
  //     https://blacksmithgu.github.io/obsidian-dataview/api/intro/#plugin-access
  const dataviewApi = app.plugins!.plugins?.["dataview"]?.api;
  if (dataviewApi && dataviewApi.pages) {
    const pages = dataviewApi.pages();
    for (const page of pages) {
      if (page.file && page.file.tasks && page.file.tasks.values) {
        tasks = tasks.concat(page.file.tasks.values);
      }
    }
  }
  const factory = new TaskFactory();
  const parsedTasks = tasks.map((rawTask) => factory.parse(rawTask));

  // Filter out empty tasks (tasks with no meaningful content after stripping metadata)
  return parsedTasks.filter((task) => !factory.isEmptyTask(task));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getNoteTasks(app: any): Task[] {
  const tasks: Task[] = [];
  const vault = app.vault;
  const metadataCache = app.metadataCache;

  // Get all markdown files in the vault
  const files = vault.getMarkdownFiles();

  for (const file of files) {
    // Get the file's metadata (frontmatter)
    const cache = metadataCache.getFileCache(file);

    if (!cache?.frontmatter?.tags) {
      continue;
    }

    // Check if the note has #task tag in frontmatter
    const tags = cache.frontmatter.tags;
    const hasTaskTag = Array.isArray(tags)
      ? tags.some((tag: string) => tag === "task" || tag === "#task")
      : tags === "task" || tags === "#task";

    if (!hasTaskTag) {
      continue;
    }

    // Parse the note as a task
    const task = parseTaskNote(file, cache, app);
    if (task) {
      tasks.push(task);
    }
  }

  return tasks;
}

/**
 * Normalize note-based task priority to emoji format
 * TaskNotes uses: "High", "Normal", "Low", "None"
 * We map to Obsidian Tasks emojis: 🔺 (highest), ⏫ (high), 🔼 (medium), 🔽 (low), ⏬ (lowest)
 * Note: "Normal" and "None" both map to empty string (no emoji), matching simple task "normal" priority
 */
function normalizeNotePriority(priority: string): string {
  if (!priority) return "";

  const normalized = priority.toLowerCase();
  switch (normalized) {
    case "high":
      return "⏫"; // high
    case "normal":
      return ""; // normal (no emoji)
    case "low":
      return "🔽"; // low
    case "none":
      return ""; // no priority
    default:
      return "";
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseTaskNote(file: any, cache: any, app: any): Task | null {
  const frontmatter = cache.frontmatter || {};
  const factory = new TaskFactory();

  // Extract task properties from frontmatter
  const status = frontmatter.status || " "; // Default to todo
  const title = file.basename; // Use note title as task text

  // Create a RawTask-like object
  const rawTask = {
    status: status,
    text: title,
    link: { path: file.path },
  };

  try {
    // Parse as a note-based task
    const task = factory.parse(rawTask, "note");

    // For note-based tasks, use the file path as the ID
    task.id = file.path;

    // Override with frontmatter data if available
    if (frontmatter.tags) {
      const tags = Array.isArray(frontmatter.tags) ? frontmatter.tags : [];
      task.tags = tags.map((t: string) => t.replace(/^#/, ""));
    }

    if (frontmatter.priority) {
      task.priority = normalizeNotePriority(frontmatter.priority);
    }

    if (typeof frontmatter.starred === "boolean") {
      task.starred = frontmatter.starred;
    }

    // Collect all incoming links from various sources
    const allIncomingLinks: string[] = [];

    // Parse blockedBy dependencies (TaskNotes format)
    // For note-based tasks, these will be file paths
    if (frontmatter.blockedBy) {
      try {
        const blockedByLinks = parseBlockedByLinks(frontmatter.blockedBy, app);
        allIncomingLinks.push(...blockedByLinks);
      } catch {
        // Failed to parse blockedBy
      }
    }

    // Also support simpler dependsOn format
    if (frontmatter.dependsOn) {
      try {
        const deps = Array.isArray(frontmatter.dependsOn)
          ? frontmatter.dependsOn
          : [frontmatter.dependsOn];
        allIncomingLinks.push(...deps);
      } catch {
        // Failed to parse dependsOn
      }
    }

    // Remove duplicates and assign to task
    task.incomingLinks = [...new Set(allIncomingLinks)];

    return task;
  } catch {
    return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseBlockedByLinks(blockedBy: any, app: any): string[] {
  const links: string[] = [];
  const vault = app.vault;

  if (!blockedBy) {
    return links;
  }

  if (!Array.isArray(blockedBy)) {
    return links;
  }

  for (const item of blockedBy) {
    try {
      let linkTarget: string | null = null;

      // Format 1: Complex object with uid and reltype
      // { uid: "[[Example task 1]]", reltype: "FINISHTOSTART" }
      if (typeof item === "object" && item !== null && "uid" in item) {
        const uid = item.uid;
        if (typeof uid === "string") {
          linkTarget = uid;
        } else {
          continue;
        }
      }
      // Format 2: Simple wiki link string
      // "[[Example task 1]]"
      else if (typeof item === "string") {
        linkTarget = item;
      }

      if (!linkTarget || typeof linkTarget !== "string") {
        continue;
      }

      // Extract the page name from wiki link format [[Page Name]]
      const wikiLinkMatch = linkTarget.match(/\[\[([^\]]+)\]\]/);
      if (!wikiLinkMatch) {
        continue;
      }

      const pageName = wikiLinkMatch[1];

      if (!pageName || typeof pageName !== "string") {
        continue;
      }

      // Try to find the file by name and get its path
      let file = null;
      try {
        file = vault.getAbstractFileByPath(pageName + ".md");
        if (!file) {
          const markdownFiles = vault.getMarkdownFiles();
          file = markdownFiles.find((f: any) => f.basename === pageName); // eslint-disable-line @typescript-eslint/no-explicit-any
        }
      } catch {
        continue;
      }

      if (!file) {
        continue;
      }

      // For note-based tasks, store the file path as the link reference
      links.push(file.path);
    } catch {
      continue;
    }
  }

  return links;
}

export function createNodesFromTasks(
  tasks: Task[],
  layoutDirection: "Horizontal" | "Vertical" = "Horizontal",
  showPriorities: boolean = true,
  showTags: boolean = true,
  debugVisualization: boolean = false,
  tagColorMode: "random" | "static" = "random",
  tagColorSeed: number = 42,
  tagStaticColor: string = "#3b82f6",
  // eslint-disable-next-line no-unused-vars
  onDeleteTask?: (taskId: string) => void
): TaskNode[] {
  const isVertical = layoutDirection === "Vertical";
  const sourcePosition = isVertical ? Position.Bottom : Position.Right;
  const targetPosition = isVertical ? Position.Top : Position.Left;

  return tasks.map((task, idx) => ({
    id: task.id,
    position: { x: 0, y: idx * 80 },
    data: {
      task,
      layoutDirection,
      showPriorities,
      showTags,
      debugVisualization,
      tagColorMode,
      tagColorSeed,
      tagStaticColor,
      onDeleteTask,
    },
    type: "task" as const,
    sourcePosition,
    targetPosition,
    draggable: true,
  }));
}

export function createEdgesFromTasks(
  tasks: Task[],
  layoutDirection: "Horizontal" | "Vertical" = "Horizontal",
  debugVisualization: boolean = false
): TaskEdge[] {
  const edges: TaskEdge[] = [];

  // Create edges based on task dependencies
  // Works for both dataview tasks (ID-based) and note tasks (file path-based)
  // because both use their respective identifiers consistently
  tasks.forEach((task) => {
    task.incomingLinks.forEach((parentTaskId) => {
      edges.push({
        id: `${parentTaskId}-${task.id}`,
        source: parentTaskId,
        target: task.id,
        type: "hash" as const,
        data: {
          hash: `${parentTaskId}-${task.id}`,
          layoutDirection,
          debugVisualization,
        },
      });
    });
  });
  return edges;
}

/**
 * Check if the Dataview plugin is installed and enabled
 * @param app Obsidian App instance
 * @returns object with isInstalled, isEnabled, and getMessage() function
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function checkDataviewPlugin(app: any) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const plugins = (app as any).plugins;

  // Check if plugin is installed (available in plugins list)
  const installedPlugins = plugins?.manifests || {};
  const isInstalled = "dataview" in installedPlugins;

  // Check if plugin is enabled (in enabledPlugins set)
  const isEnabled = plugins?.enabledPlugins?.has("dataview") || false;

  // Check if plugin is actually loaded (has API available)
  const dataviewPlugin = plugins?.plugins?.["dataview"];
  const isLoaded = !!dataviewPlugin;

  const getMessage = () => {
    if (!isInstalled) {
      return "Dataview plugin is not installed. Please install the Dataview plugin from Community Plugins to use Tasks Map.";
    }
    if (!isEnabled) {
      return "Dataview plugin is installed but not enabled. Please enable the Dataview plugin in Settings > Community Plugins to use Tasks Map.";
    }
    if (!isLoaded) {
      return "Dataview plugin is enabled but not loaded properly. Please restart Obsidian or reload the Dataview plugin.";
    }
    return null;
  };

  return {
    isInstalled,
    isEnabled,
    isLoaded,
    isReady: isInstalled && isEnabled && isLoaded,
    getMessage,
  };
}

/**
 * Generate tag colors based on mode (random or static)
 */
export function getTagColor(
  tag: string,
  mode: "random" | "static" = "random",
  seed = 42,
  staticColor = "#3B82F6"
): string {
  if (mode === "static") {
    return staticColor;
  }

  // Use seed for consistent random colors
  let hash = seed;
  for (let i = 0; i < tag.length; i++) {
    hash = (hash * 31 + tag.charCodeAt(i)) % 2147483647;
  }

  // Convert hash to HSL color with good contrast
  const hue = hash % 360;
  const saturation = 65; // Good saturation for readability
  const lightness = 45; // Dark enough for white text

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}
