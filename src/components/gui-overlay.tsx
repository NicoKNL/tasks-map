import MultiSelect from "./multi-select";
import { TaskStatus } from "src/types/task";

interface GuiOverlayProps {
	allTags: string[];
	selectedTags: string[];
	setSelectedTags: (tags: string[]) => void;
	reloadTasks: () => void;
	allStatuses: TaskStatus[];
	selectedStatuses: TaskStatus[];
	setSelectedStatuses: (statuses: TaskStatus[]) => void;
}

export default function GuiOverlay(props: GuiOverlayProps) {
	const {
		allTags,
		selectedTags,
		setSelectedTags,
		reloadTasks,
		allStatuses,
		selectedStatuses,
		setSelectedStatuses,
	} = props;

	return (
		<>
			<div className="gui-overlay-tag-select">
				<MultiSelect
					options={allTags}
					selected={selectedTags}
					setSelected={setSelectedTags}
					placeholder="Filter by tags..."
				/>
			</div>
			<div className="gui-overlay-status-select">
				<MultiSelect
					options={allStatuses}
					selected={selectedStatuses}
					setSelected={setSelectedStatuses}
					placeholder="Filter by status..."
				/>
			</div>
			<div className="gui-overlay-bottom">
				<button
					onClick={reloadTasks}
					className="gui-overlay-reload-button"
				>
					Reload Tasks
				</button>
			</div>
		</>
	);
}
