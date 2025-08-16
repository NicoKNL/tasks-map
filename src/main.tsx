import { WorkspaceLeaf } from "obsidian";
import { Plugin } from "obsidian";

import TaskMapGraphItemView, { VIEW_TYPE } from "./views/TaskMapGraphItemView";

export default class TasksMapPlugin extends Plugin {
	async onload() {
		// Configure resources needed by the plugin.
		this.registerView(
			VIEW_TYPE,
			(leaf: WorkspaceLeaf) => new TaskMapGraphItemView(leaf)
		);

		this.addCommand({
			id: "open-tasks-map-view",
			name: "Open map view",
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
