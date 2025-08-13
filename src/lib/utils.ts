import dagre from "@dagrejs/dagre";
import { App, TFile, Vault } from "obsidian";
import { Task, TaskStatus } from "src/types/task";
import { NODEHEIGHT, NODEWIDTH } from "src/components/task-node";
import { TaskFactory } from "./task-factory";

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
): Promise<boolean> {
	if (!task.link || !task.text) return false;
	const vault = app?.vault;
	if (!vault) return false;
	const file = vault.getFileByPath(task.link);
	if (!file) return false;
	const fileContent = await vault.read(file);
	const lines = fileContent.split(/\r?\n/);
	const taskLineIdx = lines.findIndex((line: string) =>
		line.includes(`📎 ${task.id}`)
	);
	if (taskLineIdx === -1) return false;
	lines[taskLineIdx] = lines[taskLineIdx].replace(
		/\[([ x/\-])\]/,
		statusSymbols[newStatus]
	);
	await vault.modify(file, lines.join("\n"));
	return true;
}

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

    return id + "-" + toTask.id;;
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
	const fileContent = await vault.read(file);
	const lines = fileContent.split(/\r?\n/);
	const taskLineIdx = lines.findIndex((line) => line.includes(task.text));
	if (taskLineIdx === -1) return;
	const sign = type === "stop" ? `⛔ ${hash}` : `🆔 ${hash}`;
	if (type === "id") {
		// If any 🆔 <6-hex> is already present, do not add another
		const idPresent = /🆔\s*[a-fA-F0-9]{6}/.test(lines[taskLineIdx]);
		if (idPresent) return;
	}
	if (lines[taskLineIdx].includes(sign)) return;
	lines[taskLineIdx] = lines[taskLineIdx] + " " + sign;
	await vault.modify(file, lines.join("\n"));
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
): Promise<boolean> {
	if (!task.link || !task.text) return false;
	const file = vault.getAbstractFileByPath(task.link);
	if (!(file instanceof TFile)) return false;
	const fileContent = await vault.read(file);
	const lines = fileContent.split(/\r?\n/);
	const taskLineIdx = lines.findIndex((line) => line.includes(task.text));
	if (taskLineIdx === -1) return false;
	const sign = type === "stop" ? `⛔ ${hash}` : `🆔 ${hash}`;
	if (!lines[taskLineIdx].includes(sign)) return false;
	lines[taskLineIdx] = lines[taskLineIdx].replace(sign, "").replace(/\s+$/, "");
	await vault.modify(file, lines.join("\n"));
	return true;
}

export function getAllDataviewTasks(app: any): Task[] {
	let tasks: any[] = [];

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
	return tasks.map((rawTask: any) => factory.parse(rawTask));
}

