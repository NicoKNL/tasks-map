import React, { useState, useEffect, useCallback } from "react";
import { ItemView, WorkspaceLeaf } from "obsidian";
import { createRoot, Root } from "react-dom/client";
import { ReactFlowProvider } from "reactflow";
import { AppContext } from "src/contexts/context";
import TaskMapGraphView from "./TaskMapGraphView";
import { checkDataviewPlugin } from "../lib/utils";
import TasksMapPlugin from "../main";
import { TasksMapSettings } from "src/types/settings";
import { FilterState, DEFAULT_FILTER_STATE } from "src/types/filter-state";
import { t } from "../i18n";

// Wrapper component that manages settings updates and filter state for the graph view
function TaskMapGraphWrapper({
  pluginSettings,
  plugin,
  onFilterStateChange,
}: {
  pluginSettings: TasksMapSettings;
  plugin: TasksMapPlugin;
  onFilterStateChange: (_state: FilterState) => void;
}) {
  const [settings, setSettings] = useState<TasksMapSettings>({
    ...pluginSettings,
  });

  useEffect(() => {
    const handler = () => setSettings({ ...plugin.settings });
    window.addEventListener("tasks-map:settings-changed", handler);
    return () =>
      window.removeEventListener("tasks-map:settings-changed", handler);
  }, [plugin]);

  const [filterState, setFilterState] = useState<FilterState>({
    ...DEFAULT_FILTER_STATE,
  });

  const handleSetFilterState = useCallback(
    (state: FilterState | ((_prev: FilterState) => FilterState)) => {
      setFilterState((prev) => {
        const next = typeof state === "function" ? state(prev) : state;
        onFilterStateChange(next);
        return next;
      });
    },
    [onFilterStateChange]
  );

  return (
    <ReactFlowProvider>
      <TaskMapGraphView
        settings={settings}
        filterState={filterState}
        setFilterState={handleSetFilterState}
        plugin={plugin}
      />
    </ReactFlowProvider>
  );
}

export const VIEW_TYPE = "tasks-map-graph-view";

export default class TaskMapGraphItemView extends ItemView {
  root: Root | null = null;
  private filterState: FilterState = { ...DEFAULT_FILTER_STATE };

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType() {
    return VIEW_TYPE;
  }

  getDisplayText() {
    return t("view.title");
  }

  /** Returns the current filter state of the open Tasks Map view. */
  getFilterState(): FilterState {
    return structuredClone(this.filterState);
  }

  async onOpen() {
    const dataviewCheck = checkDataviewPlugin(this.app);

    this.root = createRoot(this.containerEl.children[1]);

    if (!dataviewCheck.isReady) {
      this.root.render(
        <div className="tasks-map-centered-message-container">
          <div className="tasks-map-centered-message-content">
            <div className="tasks-map-message-icon">⚠️</div>
            <h3 className="tasks-map-message-title">
              {t("view.dataview_required")}
            </h3>
            <p className="tasks-map-message-description">
              {dataviewCheck.getMessage()}
            </p>
            <p className="tasks-map-message-description">
              {t("view.visit_community_plugins")}
            </p>
          </div>
        </div>
      );
      return;
    }

    // Get the plugin instance to access settings
    const plugin = (
      this.app as unknown as {
        plugins: { plugins: Record<string, TasksMapPlugin> };
      }
    ).plugins.plugins["tasks-map"] as TasksMapPlugin;

    if (!plugin) {
      this.root.render(
        <div className="tasks-map-centered-message-container">
          <div className="tasks-map-centered-message-content">
            <div className="tasks-map-message-icon">⚠️</div>
            <h3 className="tasks-map-message-title">
              {t("view.plugin_not_found")}
            </h3>
            <p className="tasks-map-message-description">
              {t("view.plugin_not_found_description")}
            </p>
          </div>
        </div>
      );
      return;
    }

    this.root.render(
      <AppContext.Provider value={this.app}>
        <TaskMapGraphWrapper
          pluginSettings={plugin.settings}
          plugin={plugin}
          onFilterStateChange={(state) => {
            this.filterState = state;
          }}
        />
      </AppContext.Provider>
    );
  }

  async onClose() {
    this.root?.unmount();
  }
}
