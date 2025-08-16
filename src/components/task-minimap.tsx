import { MiniMap } from "reactflow";

export const TaskMinimap = () => {
	const getNodeColor = (node: any) => {
		const status = node.data?.task?.status;
		switch (status) {
			case "done":
				return "var(--task-completed-green)";
			case "in_progress":
				return "var(--task-in-progress-blue)";
			case "canceled":
				return "var(--task-canceled-red)";
			default:
				return "var(--background-secondary)";
		}
	};

	return (
		<MiniMap
			nodeColor={getNodeColor}
			pannable
			zoomable
			style={{
				background: "var(--background-primary)",
				borderRadius: 8,
				overflow: "hidden",
				boxShadow: "0 2px 8px rgba(var(--color-black), 0.12)",
			}}
		/>
	);
};
