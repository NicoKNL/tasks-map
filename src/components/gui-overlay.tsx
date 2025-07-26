import React from "react";
import TagSelect from "./tag-select";

const overlayStyle: React.CSSProperties = {
	position: "absolute",
	left: "50%",
	bottom: 32,
	transform: "translateX(-50%)",
	zIndex: 20,
	display: "flex",
	gap: 12,
	pointerEvents: "auto",
};

const tagSelectWrapper: React.CSSProperties = {
	position: "absolute",
	top: 24,
	right: 32,
	zIndex: 30,
	minWidth: 220,
};

export default function GuiOverlay(props: {
	allTags: string[];
	selectedTags: string[];
	setSelectedTags: (tags: string[]) => void;
	reloadTasks: () => void;
}) {
	const { allTags, selectedTags, setSelectedTags } = props;
	return (
		<>
			<div style={tagSelectWrapper}>
				<TagSelect
					allTags={allTags}
					selectedTags={selectedTags}
					setSelectedTags={setSelectedTags}
				/>
			</div>
			<div style={overlayStyle}>
				<button
					onClick={props.reloadTasks}
					style={{
						padding: "8px 20px",
						borderRadius: 6,
						fontWeight: 600,
					}}
				>
					Reload Tasks
				</button>
			</div>
		</>
	);
}
