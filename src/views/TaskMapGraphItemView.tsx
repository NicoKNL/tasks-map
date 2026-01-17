import React, { useState, useMemo } from "react";
import { ItemView, WorkspaceLeaf } from "obsidian";
import { createRoot, Root } from "react-dom/client";
import { ReactFlowProvider } from "reactflow";
import { AppContext } from "src/contexts/context";
import TaskMapGraphView from "./TaskMapGraphView";
import { checkDataviewPlugin } from "../lib/utils";
import TasksMapPlugin from "../main";
import { TaskStatus } from "src/types/task";
import { TasksMapSettings } from "src/types/settings";

const ALL_STATUSES: TaskStatus[] = ["todo", "in_progress", "done", "canceled"];

// Wrapper component that manages filter state and keys the ReactFlowProvider
function TaskMapGraphWrapper({ settings }: { settings: TasksMapSettings }) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [excludedTags, setExcludedTags] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<TaskStatus[]>([
    ...ALL_STATUSES,
  ]);

  // Key the ReactFlowProvider on filter state to force complete remount
  const providerKey = useMemo(
    () =>
      `${selectedTags.join(",")}-${excludedTags.join(",")}-${selectedStatuses.join(",")}`,
    [selectedTags, excludedTags, selectedStatuses]
  );

  return (
    <ReactFlowProvider key={providerKey}>
      <TaskMapGraphView
        settings={settings}
        selectedTags={selectedTags}
        setSelectedTags={setSelectedTags}
        excludedTags={excludedTags}
        setExcludedTags={setExcludedTags}
        selectedStatuses={selectedStatuses}
        setSelectedStatuses={setSelectedStatuses}
      />
    </ReactFlowProvider>
  );
}

export const VIEW_TYPE = "tasks-map-graph-view";

export default class TaskMapGraphItemView extends ItemView {
  root: Root | null = null;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType() {
    return VIEW_TYPE;
  }

  getDisplayText() {
    return "Tasks map";
  }

  async onOpen() {
    const dataviewCheck = checkDataviewPlugin(this.app);

    // Get the plugin instance to access settings
    const plugin = (
      this.app as unknown as {
        plugins: { plugins: Record<string, TasksMapPlugin> };
      }
    ).plugins.plugins["tasks-map"] as TasksMapPlugin;
    const settings = plugin?.settings;

    this.root = createRoot(this.containerEl.children[1]);

    if (dataviewCheck.isReady) {
      this.root.render(
        <AppContext.Provider value={this.app}>
          <TaskMapGraphWrapper settings={settings} />
        </AppContext.Provider>
      );
    } else {
      this.root.render(
        <div className="tasks-map-centered-message-container">
          <div className="tasks-map-centered-message-content">
            <div className="tasks-map-message-icon">⚠️</div>
            <h3 className="tasks-map-message-title">
              Tasks Map requires the Dataview plugin to be installed and
              enabled.
            </h3>
            <p className="tasks-map-message-description">
              {dataviewCheck.getMessage()}
            </p>
            <p className="tasks-map-message-description">
              Visit the Community Plugins section in Settings to install or
              enable Dataview.
            </p>
          </div>
        </div>
      );
    }
  }

  async onClose() {
    this.root?.unmount();
  }
}
