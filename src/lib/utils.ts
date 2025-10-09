import dagre from "@dagrejs/dagre";
import { App, TFile, Vault } from "obsidian";
import { Task, TaskStatus, TaskNode, TaskEdge } from "src/types/task";
import { NODEHEIGHT, NODEWIDTH } from "src/components/task-node";
import { TaskFactory } from "./task-factory";
import { Position } from "reactflow";

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getLayoutedElements(nodes: any[], edges: any[]) {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: "LR" }); // Left-to-Right

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
  toTask: Task
): Promise<string | undefined> {
  if (!fromTask.link || !toTask.link) return undefined;

  const id = fromTask.id;

  await addSignToTaskInFile(vault, fromTask, "id", id);
  await addSignToTaskInFile(vault, toTask, "stop", id);

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
  hash: string
): Promise<void> {
  if (!task.link || !task.text) return;
  const file = vault.getAbstractFileByPath(task.link);
  if (!(file instanceof TFile)) return;

  await vault.process(file, (fileContent) => {
    const lines = fileContent.split(/\r?\n/);
    const taskLineIdx = lines.findIndex((line) => line.includes(task.text));
    if (taskLineIdx === -1) return fileContent;
    const sign = type === "stop" ? `⛔ ${hash}` : `🆔 ${hash}`;
    if (type === "id") {
      // If any 🆔 <6-hex> is already present, do not add another
      const idPresent = /🆔\s*[a-fA-F0-9]{6}/.test(lines[taskLineIdx]);
      if (idPresent) return fileContent;
    }
    if (lines[taskLineIdx].includes(sign)) return fileContent;
    lines[taskLineIdx] = lines[taskLineIdx] + " " + sign;

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
    const sign = type === "stop" ? `⛔ ${hash}` : `🆔 ${hash}`;
    if (!lines[taskLineIdx].includes(sign)) return fileContent;
    lines[taskLineIdx] = lines[taskLineIdx]
      .replace(sign, "")
      .replace(/\s+$/, "");
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
  return tasks.map((rawTask: any) => factory.parse(rawTask)); // eslint-disable-line @typescript-eslint/no-explicit-any
}

export function createNodesFromTasks(tasks: Task[]): TaskNode[] {
  return tasks.map((task, idx) => ({
    id: task.id,
    position: { x: 0, y: idx * 80 },
    data: { task },
    type: "task" as const,
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    draggable: true,
  }));
}

export function createEdgesFromTasks(tasks: Task[]): TaskEdge[] {
  const edges: TaskEdge[] = [];
  tasks.forEach((task) => {
    task.incomingLinks.forEach((parentTaskId) => {
      edges.push({
        id: `${parentTaskId}-${task.id}`,
        source: parentTaskId,
        target: task.id,
        type: "hash" as const,
        data: { hash: `${parentTaskId}-${task.id}` },
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
