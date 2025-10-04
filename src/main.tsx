import { WorkspaceLeaf, Plugin, Notice } from "obsidian";

import TaskMapGraphItemView, { VIEW_TYPE } from "./views/TaskMapGraphItemView";

export default class TasksMapPlugin extends Plugin {
  async onload() {
    if (!this.checkDataviewPlugin()) {
      return;
    }

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

  private checkDataviewPlugin(): boolean {
    const plugins = (this.app as any).plugins; // eslint-disable-line @typescript-eslint/no-explicit-any
    const dataviewPlugin = plugins?.plugins?.["dataview"];

    if (!dataviewPlugin) {
      new Notice(
        "Tasks Map: Dataview plugin is not installed. Please install and enable the Dataview plugin.",
        10000
      );
      return false;
    }

    if (!plugins.enabledPlugins?.has("dataview")) {
      new Notice(
        "Tasks Map: Dataview plugin is installed but not enabled. Please enable the Dataview plugin.",
        10000
      );
      return false;
    }

    return true;
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
