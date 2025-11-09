import dagre from "@dagrejs/dagre";
import { App, TFile, Vault } from "obsidian";
import { Task, TaskStatus, TaskNode, TaskEdge } from "src/types/task";
import { NODEHEIGHT, NODEWIDTH } from "src/components/task-node";
import { TaskFactory } from "./task-factory";
import { Position, Node, Edge } from "reactflow";

const statusSymbols = {
  todo: "[ ]",
  in_progress: "[/]",
  canceled: "[-]",
  done: "[x]",
};

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

  await vault.process(file, (fileContent) => {
    const lines = fileContent.split(/\r?\n/);
    let taskLineIdx = lines.findIndex((line: string) =>
      line.includes(`🆔 ${task.id}`)
    );
    if (taskLineIdx === -1) {
      // Fallback: try to find by matching the task text (legacy format)
      taskLineIdx = lines.findIndex((line: string) => line.includes(task.text));
      if (taskLineIdx === -1) return fileContent;
    }

    // TODO: Verify if the escape is really useless here (or change this parsing completely). It was added by the linter, but it seems necessary for correct regex.
    lines[taskLineIdx] = lines[taskLineIdx].replace(
      /\[([ x/\-])\]/, // eslint-disable-line no-useless-escape
      statusSymbols[newStatus]
    );
    return lines.join("\n");
  });
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

  await vault.process(file, (fileContent) => {
    const lines = fileContent.split(/\r?\n/);

    let taskLineIdx = lines.findIndex((line: string) =>
      line.includes(`🆔 ${task.id}`)
    );

    if (taskLineIdx === -1) {
      // Fallback: try to find by matching core task text (without tags/IDs)
      const coreTaskText = task.text
        .replace(/🆔\s+\S+/g, "") // Remove ID
        .replace(/#\S+/g, "") // Remove tags
        .replace(/\s+/g, " ") // Normalize whitespace
        .trim();

      taskLineIdx = lines.findIndex((line: string) => {
        const coreLineText = line
          .replace(/🆔\s+\S+/g, "")
          .replace(/#\S+/g, "")
          .replace(/\s+/g, " ")
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

  await vault.process(file, (fileContent) => {
    const lines = fileContent.split(/\r?\n/);
    let taskLineIdx = lines.findIndex((line: string) =>
      line.includes(`🆔 ${task.id}`)
    );
    if (taskLineIdx === -1) {
      // Fallback: try to find by matching core task text (without tags/IDs)
      const coreTaskText = task.text
        .replace(/🆔\s+\S+/g, "") // Remove ID
        .replace(/#\S+/g, "") // Remove tags
        .replace(/\s+/g, " ") // Normalize whitespace
        .trim();

      taskLineIdx = lines.findIndex((line: string) => {
        const coreLineText = line
          .replace(/🆔\s+\S+/g, "")
          .replace(/#\S+/g, "")
          .replace(/\s+/g, " ")
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
  direction: "Horizontal" | "Vertical" = "Horizontal"
) {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  const rankdir = direction === "Horizontal" ? "LR" : "TB"; // LR = Left-to-Right, TB = Top-to-Bottom
  dagreGraph.setGraph({ rankdir });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: NODEWIDTH, height: NODEHEIGHT });
  });
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });
  dagre.layout(dagreGraph);

  return nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    if (!nodeWithPosition) {
      return {
        ...node,
        position: { x: 0, y: 0 },
      };
    } else {
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - 90, // center horizontally
          y: nodeWithPosition.y - 30, // center vertically
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
  linkingStyle: "individual" | "csv" = "individual"
): Promise<string | undefined> {
  if (!fromTask.link || !toTask.link) return undefined;

  const id = fromTask.id;

  await addSignToTaskInFile(vault, fromTask, "id", id, linkingStyle);
  await addSignToTaskInFile(vault, toTask, "stop", id, linkingStyle);

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
  task: Task,
  type: "stop" | "id",
  hash: string,
  linkingStyle: "individual" | "csv" = "individual"
): Promise<void> {
  if (!task.link || !task.text) return;
  const file = vault.getAbstractFileByPath(task.link);
  if (!(file instanceof TFile)) return;

  await vault.process(file, (fileContent) => {
    const lines = fileContent.split(/\r?\n/);
    const taskLineIdx = lines.findIndex((line) => line.includes(task.text));
    if (taskLineIdx === -1) return fileContent;

    if (type === "id") {
      // If any 🆔 <6-hex> is already present, do not add another
      const idPresent = /🆔\s*[a-zA-Z0-9]{6}/.test(lines[taskLineIdx]);
      if (idPresent) return fileContent;

      // Always add ID individually
      const sign = `🆔 ${hash}`;
      if (lines[taskLineIdx].includes(sign)) return fileContent;
      lines[taskLineIdx] = lines[taskLineIdx] + " " + sign;
    } else if (type === "stop") {
      // Handle stop signs based on linking style
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
  await removeSignFromTaskInFile(vault, toTask, "stop", hash);
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
      // Remove ID sign (always individual)
      const sign = `🆔 ${hash}`;
      if (!lines[taskLineIdx].includes(sign)) return fileContent;
      lines[taskLineIdx] = lines[taskLineIdx]
        .replace(sign, "")
        .replace(/\s+$/, "");
    } else if (type === "stop") {
      // Handle stop sign removal for both formats
      // First try CSV format
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
        // Try individual format
        const sign = `⛔ ${hash}`;
        if (lines[taskLineIdx].includes(sign)) {
          lines[taskLineIdx] = lines[taskLineIdx]
            .replace(sign, "")
            .replace(/\s+$/, "");
        }
      }
    }

    return lines.join("\n");
  });
}

// TODO: Improve typing for app parameter
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getAllDataviewTasks(app: any): Task[] {
  // TODO: Tasks should use typing, either from dataview or the tasks plugin if available
  let tasks: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any

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
  const parsedTasks = tasks.map((rawTask: any) => factory.parse(rawTask)); // eslint-disable-line @typescript-eslint/no-explicit-any

  // Filter out empty tasks (tasks with no meaningful content after stripping metadata)
  return parsedTasks.filter((task) => !factory.isEmptyTask(task));
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
  allTags: string[] = []
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
      allTags,
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
