import { ItemView, WorkspaceLeaf } from "obsidian";
import { createRoot, Root } from "react-dom/client";
import { ReactFlowProvider } from "reactflow";
import { AppContext } from "src/contexts/context";
import TaskMapGraphView from "./TaskMapGraphView";

export const VIEW_TYPE = "task-map-graph-view";

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
		this.root = createRoot(this.containerEl.children[1]);
		this.root.render(
			<AppContext.Provider value={this.app}>
				<ReactFlowProvider>
					<TaskMapGraphView />
				</ReactFlowProvider>
			</AppContext.Provider>
		);
	}

	async onClose() {
		this.root?.unmount();
	}
}
