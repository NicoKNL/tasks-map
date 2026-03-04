import React, { useState, useMemo, useEffect } from "react";
import { ItemView, WorkspaceLeaf } from "obsidian";
import { createRoot, Root } from "react-dom/client";
import { ReactFlowProvider } from "reactflow";
import { AppContext } from "src/contexts/context";
import TaskMapGraphView from "./TaskMapGraphView";
import { checkDataviewPlugin } from "../lib/utils";
import TasksMapPlugin from "../main";
import { TaskStatus } from "src/types/task";
import { TasksMapSettings } from "src/types/settings";
import { t } from "../i18n";

const ALL_STATUSES: TaskStatus[] = ["todo", "in_progress", "done", "canceled"];

// Wrapper component that manages filter state and keys the ReactFlowProvider
function TaskMapGraphWrapper({
  settings,
  initialFilterSettings
}: {
  settings: TasksMapSettings;
  initialFilterSettings?: any;
}) {
  // 使用初始过滤设置（如果有）
  const [selectedTags, setSelectedTags] = useState<string[]>(
    initialFilterSettings?.selectedTags || []
  );
  const [excludedTags, setExcludedTags] = useState<string[]>(
    initialFilterSettings?.excludedTags || []
  );
  const [selectedStatuses, setSelectedStatuses] = useState<TaskStatus[]>(
    initialFilterSettings?.selectedStatuses && initialFilterSettings.selectedStatuses.length > 0
      ? initialFilterSettings.selectedStatuses
      : [...ALL_STATUSES]
  );
  const [selectedFiles, setSelectedFiles] = useState<string[]>(
    initialFilterSettings?.selectedFiles || []
  );

  // 应用其他视图设置
  useEffect(() => {
    if (initialFilterSettings) {
      // 这里可以应用其他视图设置，如hideTags等
      // 这些设置可能需要通过context或其他方式传递给子组件
    }
  }, [initialFilterSettings]);

  // Key the ReactFlowProvider on filter state to force complete remount
  const providerKey = useMemo(
    () =>
      `${selectedTags.join(",")}-${excludedTags.join(",")}-${selectedStatuses.join(",")}-${selectedFiles.join(",")}`,
    [selectedTags, excludedTags, selectedStatuses, selectedFiles]
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
        selectedFiles={selectedFiles}
        setSelectedFiles={setSelectedFiles}
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
    return t("view.title");
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

    // 获取初始过滤设置
    const initialFilterSettings = plugin?.getActiveFilterSettings?.();

    // 清除插件中的过滤设置，避免重复使用
    if (plugin?.clearActiveFilterSettings) {
      plugin.clearActiveFilterSettings();
    }

    this.root = createRoot(this.containerEl.children[1]);

    if (dataviewCheck.isReady) {
      this.root.render(
        <AppContext.Provider value={this.app}>
          <TaskMapGraphWrapper
            settings={settings}
            initialFilterSettings={initialFilterSettings}
          />
        </AppContext.Provider>
      );
    } else {
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
    }
  }

  async onClose() {
    this.root?.unmount();
  }
}
