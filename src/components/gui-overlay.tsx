import React from "react";
import TagSelect from "./tag-select";

export default function GuiOverlay(props: {
	allTags: string[];
	selectedTags: string[];
	setSelectedTags: (tags: string[]) => void;
	reloadTasks: () => void;
}) {
	const { allTags, selectedTags, setSelectedTags } = props;
	return (
		<>
			<div className="gui-overlay-tag-select">
				<TagSelect
					allTags={allTags}
					selectedTags={selectedTags}
					setSelectedTags={setSelectedTags}
				/>
			</div>
			<div className="gui-overlay-bottom">
				<button
					onClick={props.reloadTasks}
					className="gui-overlay-reload-button"
				>
					Reload Tasks
				</button>
			</div>
		</>
	);
}
