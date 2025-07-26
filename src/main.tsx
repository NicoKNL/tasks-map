import { WorkspaceLeaf } from "obsidian";
import { Plugin } from "obsidian";

import TaskMapGraphView, { VIEW_TYPE } from "./views/GraphView";

export default class TasksMapPlugin extends Plugin {
	async onload() {
		// Configure resources needed by the plugin.
		this.registerView(
			VIEW_TYPE,
			(leaf: WorkspaceLeaf) => new TaskMapGraphView(leaf)
		);

		this.addCommand({
			id: "open-tasks-map-view",
			name: "Open Tasks Map View",
			callback: () => {
				this.activateViewInMainArea();
			},
		});
	}

	async activateViewInMainArea() {
		const leaf = this.app.workspace.getLeaf(true); // true = main area
		await leaf.setViewState({ type: VIEW_TYPE, active: true });
		this.app.workspace.revealLeaf(leaf);
	}

	async onunload() {
		// Release any resources configured by the plugin.
	}
}
