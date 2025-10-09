import { ItemView, WorkspaceLeaf } from "obsidian";
import { createRoot, Root } from "react-dom/client";
import { ReactFlowProvider } from "reactflow";
import { AppContext } from "src/contexts/context";
import TaskMapGraphView from "./TaskMapGraphView";
import { checkDataviewPlugin } from "../lib/utils";

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

    this.root = createRoot(this.containerEl.children[1]);

    if (dataviewCheck.isReady) {
      this.root.render(
        <AppContext.Provider value={this.app}>
          <ReactFlowProvider>
            <TaskMapGraphView />
          </ReactFlowProvider>
        </AppContext.Provider>
      );
    } else {
      this.root.render(
        <div
          style={{
            padding: "20px",
            textAlign: "center",
            color: "var(--text-muted)",
            fontSize: "14px",
          }}
        >
          <h3 style={{ color: "var(--text-normal)", marginBottom: "10px" }}>
            Tasks Map requires the Dataview plugin to be installed and enabled.
          </h3>
          <p style={{ marginBottom: "15px" }}>{dataviewCheck.getMessage()}</p>
          <p style={{ fontSize: "12px" }}>
            Visit the Community Plugins section in Settings to install or enable
            Dataview.
          </p>
        </div>
      );
    }
  }

  async onClose() {
    this.root?.unmount();
  }
}
