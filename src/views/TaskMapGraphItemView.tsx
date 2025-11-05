import { ItemView, WorkspaceLeaf } from "obsidian";
import { createRoot, Root } from "react-dom/client";
import { ReactFlowProvider } from "reactflow";
import { AppContext } from "src/contexts/context";
import TaskMapGraphView from "./TaskMapGraphView";
import { checkDataviewPlugin } from "../lib/utils";
import TasksMapPlugin from "../main";

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
          <ReactFlowProvider>
            <TaskMapGraphView settings={settings} />
          </ReactFlowProvider>
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
