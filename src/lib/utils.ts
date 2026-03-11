// Task utility functions - refactored to use OOP with polymorphism
import dagre from "@dagrejs/dagre";
import { App, Notice, TFile, Vault } from "obsidian";
import { TaskStatus, TaskNode, TaskEdge, RawTask } from "src/types/task";
import { BaseTask } from "src/types/base-task";
import { NODEHEIGHT, NODEWIDTH } from "src/components/task-node";
import { TaskFactory } from "./task-factory";
import { Position, Node, Edge } from "reactflow";
import { t } from "../i18n";

export const statusSymbols = {
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
    emoji: /🛫\s+[^\s]+/g,
    dataview: /\[\[start::[^\]]+\]\]/g,
  },
  scheduled: {
    emoji: /⏳\s+[^\s]+/g,
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
  task: BaseTask,
  showTags: boolean = true
): { width: number; height: number } {
  // Base dimensions
  const minWidth = NODEWIDTH; // 200px
  const maxWidth = 500;
  const baseHeight = 60; // Minimum height for header (status, priority, buttons)

  // Estimate width based on summary length
  // Average character width ~7px, but with icons and buttons taking space
  const charWidth = 7;
  const paddingHorizontal = 24; // 12px left + 12px right
  const iconsWidth = 80; // Approximate width for status, priority, star, link, menu buttons

  // Calculate required width for summary text
  const summaryWidth = task.summary.length * charWidth;
  // Calculate required width for tags (if shown)
  let tagsWidth = 0;
  if (showTags && task.tags.length > 0) {
    // Estimate tag width: each tag ~ (tag.length * 6 + 20) pixels
    const tagExtra = 20; // padding + remove button
    const tagCharWidth = 6;
    tagsWidth = task.tags.reduce((max, tag) => {
      const width = tag.length * tagCharWidth + tagExtra;
      return Math.max(max, width);
    }, 0);
    // Tags can wrap, so we don't need to sum all widths, just the widest tag
  }

  // Desired width is based on summary, tags, and icons
  const desiredContentWidth = Math.max(summaryWidth, tagsWidth) + iconsWidth;
  const desiredTotalWidth = desiredContentWidth + paddingHorizontal;

  // Clamp width between min and max
  const width = Math.min(maxWidth, Math.max(minWidth, desiredTotalWidth));

  // Estimate height based on summary length with calculated width
  const effectiveContentWidth = width - paddingHorizontal; // Content area width
  const charsPerLine = Math.floor(effectiveContentWidth / charWidth);
  const lineHeight = 22; // Slightly more than font size for line spacing
  const summaryLines =
    charsPerLine > 0 ? Math.ceil(task.summary.length / charsPerLine) : 1;
  const summaryHeight = Math.max(1, summaryLines) * lineHeight;

  // Estimate height for tags (each row of tags is ~28px)
  let tagsHeight = 0;
  if (showTags && task.tags.length > 0) {
    // Estimate how many tags per row based on width
    const tagMinWidth = 60; // Minimum width per tag
    const tagsPerRow = Math.max(
      1,
      Math.floor(effectiveContentWidth / tagMinWidth)
    );
    const tagRows = Math.ceil((task.tags.length + 1) / tagsPerRow); // +1 for "Add tag" button
    tagsHeight = tagRows * 28;
  }

  // Add padding and safety margin
  // Consider that nodes have:
  // - padding: 12px (from .tasks-map-task-background)
  // - border: 1px
  // - box-shadow: some visual spacing
  // - internal spacing between elements
  const padding = 30; // 12px top + 12px bottom + extra for visual elements
  const safetyMargin = 20; // Extra buffer for spacing between nodes

  const totalHeight =
    baseHeight + summaryHeight + tagsHeight + padding + safetyMargin;

  return {
    width,
    height: Math.max(NODEHEIGHT, totalHeight),
  };
}

/**
 * Find the index of a task line in an array of lines by its ID.
 * Supports both emoji format (🆔 abc123) and Dataview format ([id:: abc123])
 */
export function findTaskLineByIdOrText(
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
    line.includes(`[id:: ${taskId}]`)
  );

  if (taskLineIdx !== -1) return taskLineIdx;

  // Fallback: try to find by matching the task text (legacy format)
  taskLineIdx = lines.findIndex((line: string) => line.includes(taskText));

  return taskLineIdx;
}

export async function updateTaskStatusInVault(
  task: BaseTask,
  newStatus: TaskStatus,
  app: App
): Promise<void> {
  await task.updateStatus(newStatus, app);
}

export async function addTaskLineToVault(
  task: BaseTask,
  newTaskLine: string,
  app: App
): Promise<void> {
  await task.addTaskLine(newTaskLine, app);
}

export async function addIsolatedTaskLineToVault(
  newText: string,
  filePath: string,
  app: App
) {
  const file = app.vault.getAbstractFileByPath(filePath);

  if (!(file instanceof TFile)) {
    throw new Error(`文件 ${filePath} 不存在`);
  }

  await app.vault.process(file, (data: string) => {
    // 检查是否已存在相同内容
    if (data.includes(newText)) {
      return data; // 直接返回原始内容
    }

    // 构建新内容
    let separator = "";
    if (data.length > 0) {
      if (!data.endsWith("\n\n")) {
        // 确保至少有一个换行符，最好是两个（空行）
        separator = data.endsWith("\n") ? "\n" : "\n\n";
      } else if (!data.endsWith("\n")) {
        separator = "\n";
      }
    }

    return data + separator + newText + "\n";
  });
}

export async function deleteTaskFromVault(
  task: BaseTask,
  app: App
): Promise<void> {
  await task.delete(app);
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
export function addDateToTask(
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
export function removeDateFromTask(taskLine: string, dateType: string): string {
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
export function getTodayDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0"); // Month is 0-indexed
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export async function removeTagFromTaskInVault(
  task: BaseTask,
  tagToRemove: string,
  app: App
): Promise<void> {
  await task.removeTag(tagToRemove, app);
}

export async function addStarToTaskInVault(
  task: BaseTask,
  app: App
): Promise<void> {
  await task.addStar(app);
}

export async function removeStarFromTaskInVault(
  task: BaseTask,
  app: App
): Promise<void> {
  await task.removeStar(app);
}

export async function addTagToTaskInVault(
  task: BaseTask,
  tagToAdd: string,
  app: App
): Promise<void> {
  await task.addTag(tagToAdd, app);
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

  // Store calculated dimensions for each node
  const nodeDimensions = new Map<string, { width: number; height: number }>();
  const allWidths: number[] = [];
  const allHeights: number[] = [];

  nodes.forEach((node) => {
    // Get task from node data to estimate dimensions
    const task = node.data?.task as BaseTask | undefined;
    const dimensions = task
      ? estimateNodeDimensions(task, showTags)
      : { width: NODEWIDTH, height: NODEHEIGHT };

    nodeDimensions.set(node.id, dimensions);
    dagreGraph.setNode(node.id, dimensions);

    // Collect dimensions for statistical analysis
    allWidths.push(dimensions.width);
    allHeights.push(dimensions.height);
  });

  // Use fixed small spacing for compact layout
  // This prevents large nodes from causing sparse layouts

  // Calculate statistical measures to avoid over-spacing due to outliers
  // Sort dimensions to calculate percentiles
  allWidths.sort((a, b) => a - b);
  allHeights.sort((a, b) => a - b);

  // Helper function to calculate robust representative dimension
  const getRobustRepresentative = (sortedValues: number[], defaultValue: number): number => {
    if (sortedValues.length === 0) return defaultValue;

    const n = sortedValues.length;

    // Calculate median
    const median = n % 2 === 0
      ? (sortedValues[n / 2 - 1] + sortedValues[n / 2]) / 2
      : sortedValues[Math.floor(n / 2)];

    // Calculate first and third quartiles
    const q1Index = Math.floor(n * 0.25);
    const q3Index = Math.floor(n * 0.75);
    const q1 = sortedValues[q1Index];
    const q3 = sortedValues[q3Index];

    // Interquartile range (IQR)
    const iqr = q3 - q1;

    // Upper bound for outliers: Q3 + 1.5 * IQR
    const upperBound = q3 + 1.5 * iqr;

    // Find the maximum value that's not an outlier
    let robustMax = median;
    for (let i = n - 1; i >= 0; i--) {
      if (sortedValues[i] <= upperBound) {
        robustMax = sortedValues[i];
        break;
      }
    }

    // For layout spacing, use median only (ignore larger nodes for spacing calculation)
    // This prevents a single large node from making the entire layout sparse
    return median;
  };

  // Use fixed small spacing for compact grid layout
  const FIXED_NODESEP = 80; // Fixed horizontal spacing between nodes in same rank (reduced for tighter grid)
  const FIXED_RANKSEP = 30; // Fixed vertical spacing between ranks (reduced for tighter grid)

  let nodesep, ranksep;
  if (rankdir === "TB") {
    // Vertical layout: nodes flow top to bottom
    ranksep = FIXED_RANKSEP;
    nodesep = FIXED_NODESEP;
  } else { // LR
    // Horizontal layout: nodes flow left to right
    ranksep = FIXED_NODESEP;
    nodesep = FIXED_RANKSEP;
  }

  // Set graph layout options for compact grid layout
  dagreGraph.setGraph({
    rankdir,
    nodesep,
    ranksep,
    edgesep: 10, // further reduced for tighter edge spacing
    ranker: "tight-tree", // minimize edge lengths and crossings
    align: "UL", // align nodes to upper left (grid alignment)
    marginx: 15, // minimal margins
    marginy: 15,
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });
  dagre.layout(dagreGraph);

  // Get initial layouted positions with their dimensions
  const nodesWithDimensions = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const dimensions = nodeDimensions.get(node.id) || {
      width: NODEWIDTH,
      height: NODEHEIGHT,
    };

    if (!nodeWithPosition) {
      return {
        node: {
          ...node,
          position: { x: 0, y: 0 },
        },
        dimensions,
      };
    } else {
      return {
        node: {
          ...node,
          position: {
            // Center the node at the position dagre calculated
            x: nodeWithPosition.x - dimensions.width / 2,
            y: nodeWithPosition.y - dimensions.height / 2,
          },
        },
        dimensions,
      };
    }
  });

  // Minimal post-processing to resolve overlaps while maintaining grid alignment
  const compactedNodes = compactLayout(nodesWithDimensions, rankdir);
  return compactedNodes;
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
  fromTask: BaseTask,
  toTask: BaseTask,
  linkingStyle: "individual" | "csv" | "dataview" = "individual"
): Promise<string | undefined> {
  if (!fromTask.link || !toTask.link) return undefined;

  const id = fromTask.id;

  // Use polymorphism - each task type handles its own linking logic
  await toTask.addLinkMetadata(vault, fromTask, linkingStyle);

  return id + "-" + toTask.id;
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
  task: BaseTask,
  type: "stop" | "id",
  hash: string,
  linkingStyle: "individual" | "csv" | "dataview" = "individual"
): Promise<void> {
  if (!task.link || !task.text) return;
  const file = vault.getAbstractFileByPath(task.link);
  if (!(file instanceof TFile)) return;

  await vault.process(file, (fileContent) => {
    const lines = fileContent.split(/\r?\n/);
    const taskLineIdx = findTaskLineByIdOrText(lines, task.id, task.text);
    if (taskLineIdx === -1) {
      new Notice(`Failed to find task line for ${task.id}`);
      return fileContent;
    }

    const oldLine = lines[taskLineIdx];

    if (type === "id") {
      // Check if any ID format is already present
      const emojiIdPresent = /🆔\s*[a-zA-Z0-9]{6}/.test(lines[taskLineIdx]);
      const dataviewIdPresent = /\[id::\s*[a-zA-Z0-9]{6}\]/.test(
        lines[taskLineIdx]
      );

      if (emojiIdPresent || dataviewIdPresent) return fileContent;

      // Add ID in the configured format
      if (linkingStyle === "dataview") {
        const sign = `[id:: ${hash}]`;
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
        /\[id::\s*[a-zA-Z0-9]{6}\]/.test(lines[taskLineIdx]) ||
        /\[dependsOn::\s*[a-zA-Z0-9]{6}(?:,\s*[a-zA-Z0-9]{6})*\]/.test(
          lines[taskLineIdx]
        );

      if (usesDataviewFormat) {
        // Handle Dataview format dependencies
        const dataviewRegex =
          /\[dependsOn::\s*([a-zA-Z0-9]{6}(?:,\s*[a-zA-Z0-9]{6})*)\]/;
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
              `[dependsOn:: ${newList}]`
            );
          }
        } else {
          // No existing Dataview dependencies, add new one
          lines[taskLineIdx] = lines[taskLineIdx] + ` [dependsOn:: ${hash}]`;
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

    if (lines[taskLineIdx] === oldLine) {
      new Notice("Failed to add the edge!");
    } else {
      new Notice("Edge added successfully.");
    }

    return lines.join("\n");
  });
}

// Remove a link hash from both source and target tasks in their files
export async function removeLinkSignsBetweenTasks(
  vault: Vault,
  toTask: BaseTask,
  hash: string
): Promise<void> {
  if (!toTask.link) return;

  // Use polymorphism - each task type handles its own link removal logic
  await toTask.removeLinkMetadata(vault, hash);
}

export async function removeSignFromTaskInFile(
  vault: Vault,
  task: BaseTask,
  type: "stop" | "id",
  hash: string
): Promise<void> {
  if (!task.link || !task.text) return;
  const file = vault.getAbstractFileByPath(task.link);
  if (!(file instanceof TFile)) return;

  await vault.process(file, (fileContent) => {
    const lines = fileContent.split(/\r?\n/);
    const taskLineIdx = findTaskLineByIdOrText(lines, task.id, task.text);
    if (taskLineIdx === -1) {
      new Notice(`Failed to find task line for ${task.id}`);
      return fileContent;
    }

    const oldLine = lines[taskLineIdx];

    if (type === "id") {
      // Remove emoji ID sign
      const emojiSign = `🆔 ${hash}`;
      if (lines[taskLineIdx].includes(emojiSign)) {
        lines[taskLineIdx] = lines[taskLineIdx]
          .replace(emojiSign, "")
          .replace(/\s+$/, "");
        if (lines[taskLineIdx] === oldLine) {
          new Notice("Failed to delete the edge!");
        } else {
          new Notice("Edge deleted successfully.");
        }
        return lines.join("\n");
      }

      // Remove Dataview ID sign
      const dataviewSign = `[id:: ${hash}]`;
      if (lines[taskLineIdx].includes(dataviewSign)) {
        lines[taskLineIdx] = lines[taskLineIdx]
          .replace(dataviewSign, "")
          .replace(/\s+$/, "");
      }
    } else if (type === "stop") {
      // First try Dataview format
      const dataviewRegex =
        /\[dependsOn::\s*([a-zA-Z0-9]{6}(?:,\s*[a-zA-Z0-9]{6})*)\]/;
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
            `[dependsOn:: ${newList}]`
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

    if (lines[taskLineIdx] === oldLine) {
      new Notice("Failed to delete the edge!");
    } else {
      new Notice("Edge deleted successfully.");
    }

    return lines.join("\n");
  });
}

// TODO: Improve typing for app parameter
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getAllTasks(app: any): BaseTask[] {
  // Central function to gather tasks from all available sources
  const allTasks: BaseTask[] = [];

  // Source 1: Dataview plugin tasks
  allTasks.push(...getAllDataviewTasks(app));

  // Source 2: Note-based tasks (notes with #task in frontmatter)
  allTasks.push(...getNoteTasks(app));

  return allTasks;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getAllDataviewTasks(app: any): BaseTask[] {
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
export function getNoteTasks(app: any): BaseTask[] {
  const tasks: BaseTask[] = [];
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
function parseTaskNote(file: any, cache: any, app: any): BaseTask | null {
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
  tasks: BaseTask[],
  layoutDirection: "Horizontal" | "Vertical" = "Horizontal",
  showPriorities: boolean = true,
  showTags: boolean = true,
  debugVisualization: boolean = false,
    tagColorMode: "random" | "static" = "random",
  tagColorSeed: number = 42,
  tagStaticColor: string = "#3b82f6",
  themeMode: "light" | "dark" | "system" = "system",
  // eslint-disable-next-line no-unused-vars
  onDeleteTask?: (taskId: string) => void,
  // eslint-disable-next-line no-unused-vars
  onAiNext?: (taskId: string) => Promise<void>,
  // eslint-disable-next-line no-unused-vars
  onAiBefore?: (taskId: string) => Promise<void>,
  // Proximity color settings
  dueProximityDays: number = 7,
  dueProximityColor: string = "#ef4444",
  scheduleProximityDays: number = 7,
  scheduleProximityColor: string = "#f59e0b",
  // Date tooltip settings
  showDateTooltips: boolean = true,
  tooltipMaxWidth: number = 250,
  tooltipSpacing: number = 6,
  tooltipFontSize: number = 11,
  tooltipCapsulePadding: number = 4,
  tooltipLineHeight: number = 1.5,
  tooltipVerticalOffset: number = 8
): TaskNode[] {
  const isVertical = layoutDirection === "Vertical";
  const sourcePosition = isVertical ? Position.Bottom : Position.Right;
  const targetPosition = isVertical ? Position.Top : Position.Left;

  return tasks.map((task, idx) => {
    const dimensions = estimateNodeDimensions(task, showTags);
    return {
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
        themeMode,
        onDeleteTask,
        onAiNext,
        onAiBefore,
        width: dimensions.width,
        height: dimensions.height,
        // Proximity color settings
        dueProximityDays,
        dueProximityColor,
        scheduleProximityDays,
        scheduleProximityColor,
        // Date tooltip settings
        showDateTooltips,
        tooltipMaxWidth,
        tooltipSpacing,
        tooltipFontSize,
        tooltipCapsulePadding,
        tooltipLineHeight,
        tooltipVerticalOffset,
      },
      type: "task" as const,
      sourcePosition,
      targetPosition,
      draggable: true,
      width: dimensions.width,
      height: dimensions.height,
    };
  });
}

export function createEdgesFromTasks(
  tasks: BaseTask[],
  layoutDirection: "Horizontal" | "Vertical" = "Horizontal",
  debugVisualization: boolean = false
): TaskEdge[] {
  const edges: TaskEdge[] = [];

  // Create edges based on task dependencies
  // Works for both dataview tasks (ID-based) and note tasks (file path-based)
  // because both use their respective identifiers consistently
  tasks.forEach((task) => {
    task.incomingLinks.forEach((parentTaskId: string) => {
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
      return t("view.dataview_not_installed");
    }
    if (!isEnabled) {
      return t("view.dataview_disabled");
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
 * Post-process layout to make it more compact while preventing node overlap
 */
function compactLayout(
  nodesWithDimensions: { node: Node; dimensions: { width: number; height: number } }[],
  rankdir: "TB" | "LR"
): Node[] {
  if (nodesWithDimensions.length <= 1) {
    return nodesWithDimensions.map(({ node }) => node);
  }

  // For now, return nodes without compaction to preserve grid alignment
  // We'll only do minimal overlap resolution if needed
  const adjustedNodes = nodesWithDimensions.map(({ node }) => ({ ...node }));

  // Only resolve overlaps if they exist, but try to maintain grid structure
  // We'll do a single pass and only move nodes minimally
  for (let i = 0; i < adjustedNodes.length; i++) {
    const nodeA = adjustedNodes[i];
    const dimsA = nodesWithDimensions[i].dimensions;

    for (let j = i + 1; j < adjustedNodes.length; j++) {
      const nodeB = adjustedNodes[j];
      const dimsB = nodesWithDimensions[j].dimensions;

      // Check for overlap
      const overlapX = Math.max(0,
        Math.min(nodeA.position.x + dimsA.width, nodeB.position.x + dimsB.width) -
        Math.max(nodeA.position.x, nodeB.position.x)
      );

      const overlapY = Math.max(0,
        Math.min(nodeA.position.y + dimsA.height, nodeB.position.y + dimsB.height) -
        Math.max(nodeA.position.y, nodeB.position.y)
      );

      if (overlapX > 0 && overlapY > 0) {
        // Nodes overlap, push them apart minimally
        // Try to maintain original grid alignment by moving along primary axis
        if (rankdir === "TB") {
          // Vertical layout: move vertically to resolve overlap
          if (nodeA.position.y < nodeB.position.y) {
            // Move A up, B down
            nodeA.position.y -= overlapY / 2;
            nodeB.position.y += overlapY / 2;
          } else {
            nodeA.position.y += overlapY / 2;
            nodeB.position.y -= overlapY / 2;
          }
        } else {
          // Horizontal layout: move horizontally to resolve overlap
          if (nodeA.position.x < nodeB.position.x) {
            // Move A left, B right
            nodeA.position.x -= overlapX / 2;
            nodeB.position.x += overlapX / 2;
          } else {
            nodeA.position.x += overlapX / 2;
            nodeB.position.x -= overlapX / 2;
          }
        }
      }
    }
  }

  return adjustedNodes;
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

/**
 * Extract a date of specific type from task text
 * @param taskText The full task text
 * @param dateType Type of date to extract ('due', 'scheduled', 'start', 'done', 'created', 'canceled')
 * @returns Date string in YYYY-MM-DD format, or null if not found
 */
export function extractDateFromTaskText(
  taskText: string,
  dateType: string
): string | null {
  if (!validDateTypes.includes(dateType)) {
    return null;
  }

  const patterns = formatPatterns[dateType];
  if (!patterns) {
    return null;
  }

  // Try emoji format first
  const emojiPattern = patterns.emoji;
  const emojiMatch = taskText.match(emojiPattern);
  if (emojiMatch) {
    // Extract date part after emoji
    const parts = emojiMatch[0].split(/\s+/);
    if (parts.length >= 2) {
      // Return the date part (remove emoji)
      return parts[1];
    }
  }

  // Try dataview format
  const dataviewPattern = patterns.dataview;
  const dataviewMatch = taskText.match(dataviewPattern);
  if (dataviewMatch) {
    // Extract date from [[type::date]] format
    const match = dataviewMatch[0];
    const dateMatch = match.match(/::([^\]]+)\]\]/);
    if (dateMatch && dateMatch[1]) {
      return dateMatch[1];
    }
  }

  // Try CSV format (due:2023-10-05)
  const csvPattern = new RegExp(`\\s+${dateType}:([^\\s,]+)`, "g");
  const csvMatch = taskText.match(csvPattern);
  if (csvMatch) {
    // Get first match
    const match = csvMatch[0];
    const dateMatch = match.match(new RegExp(`${dateType}:([^\\s,]+)`));
    if (dateMatch && dateMatch[1]) {
      return dateMatch[1];
    }
  }

  return null;
}

/**
 * Calculate color based on proximity to target date
 * @param baseColor Original node color (CSS color value)
 * @param targetColor Target proximity color (CSS color value)
 * @param daysRemaining Days remaining until target date (positive = future, negative = past)
 * @param proximityDays Number of days when gradient starts (e.g., 7 means color starts changing 7 days before)
 * @returns CSS color string interpolated between baseColor and targetColor
 */
export function calculateProximityColor(
  baseColor: string,
  targetColor: string,
  daysRemaining: number,
  proximityDays: number
): string {
  // If daysRemaining is greater than proximityDays, use base color
  if (daysRemaining > proximityDays) {
    return baseColor;
  }

  // If daysRemaining is 0 or negative, use target color
  if (daysRemaining <= 0) {
    return targetColor;
  }

  // Linear interpolation between baseColor and targetColor
  // Ratio = 1 - (daysRemaining / proximityDays)
  // As daysRemaining decreases from proximityDays to 0, ratio increases from 0 to 1
  const ratio = 1 - (daysRemaining / proximityDays);

  // Simple color interpolation - assumes colors are in hex format
  // For simplicity, we'll use CSS rgba() for interpolation
  // Convert hex colors to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };

  const rgb1 = hexToRgb(baseColor);
  const rgb2 = hexToRgb(targetColor);

  const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * ratio);
  const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * ratio);
  const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * ratio);

  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Calculate days remaining between a date string and today
 * @param dateStr Date string in YYYY-MM-DD format (or relative date like 'today', 'tomorrow')
 * @returns Number of days remaining (positive = future, negative = past)
 */
export function daysRemainingFromToday(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let targetDate: Date;

  // Handle relative dates
  if (dateStr.toLowerCase() === 'today') {
    targetDate = new Date(today);
  } else if (dateStr.toLowerCase() === 'tomorrow') {
    targetDate = new Date(today);
    targetDate.setDate(today.getDate() + 1);
  } else if (dateStr.toLowerCase() === 'yesterday') {
    targetDate = new Date(today);
    targetDate.setDate(today.getDate() - 1);
  } else {
    // Try parsing as YYYY-MM-DD
    targetDate = new Date(dateStr);
    if (isNaN(targetDate.getTime())) {
      // Invalid date, return a large number so color doesn't change
      return 999;
    }
  }

  targetDate.setHours(0, 0, 0, 0);

  const diffMs = targetDate.getTime() - today.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Find all related task IDs (connected via dependencies) for a given task ID.
 * Uses the tasks array to build adjacency list from incomingLinks.
 * Returns a Set of task IDs including the given task ID.
 */
export function findRelatedTaskIds(tasks: BaseTask[], taskId: string): Set<string> {
  // Build adjacency list: map from task ID to list of neighbor IDs (both parents and children)
  const adjacency = new Map<string, string[]>();

  // Initialize adjacency for all tasks
  tasks.forEach(task => {
    adjacency.set(task.id, []);
  });

  // Add edges based on incomingLinks (parent -> child)
  tasks.forEach(task => {
    task.incomingLinks.forEach(parentId => {
      // parentId may not exist in tasks (if filtered out), but we still add edge if parent exists
      if (adjacency.has(parentId)) {
        adjacency.get(parentId)!.push(task.id);
        adjacency.get(task.id)!.push(parentId); // undirected, so add reverse
      }
    });
  });

  // BFS to find all connected tasks
  const visited = new Set<string>();
  const queue = [taskId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (visited.has(currentId)) continue;
    visited.add(currentId);

    const neighbors = adjacency.get(currentId) || [];
    for (const neighborId of neighbors) {
      if (!visited.has(neighborId)) {
        queue.push(neighborId);
      }
    }
  }

  return visited;
}
