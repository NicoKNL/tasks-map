import React from "react";
import { Task, TaskStatus } from "src/types/task";
import { updateTaskStatusInVault } from "src/lib/utils";
import { useApp } from "src/hooks/hooks";

interface TaskStatusProps {
	status: TaskStatus;
	task: Task;
	onStatusChange: (newStatus: TaskStatus) => void;
}

const statusIcons = {
	todo: "⬜",
	in_progress: "🔵",
	done: "✅",
	canceled: "❌",
};

export function TaskStatusToggle({
	status,
	task,
	onStatusChange,
}: TaskStatusProps) {
	const app = useApp();

	const handleToggleStatus = async (e: React.MouseEvent) => {
		console.log("Toggling status for task:", task.id);
		e.stopPropagation();
		// Cycle through statuses: todo -> in_progress -> done
		// (canceled status is set through a separate action)
		const statusCycle: TaskStatus[] = ["todo", "in_progress", "done"];
		const currentIndex = statusCycle.indexOf(status);
		console.log("Current status index:", currentIndex);
		const newStatus = statusCycle[(currentIndex + 1) % statusCycle.length];
		console.log("New status:", newStatus);
		const ok = await updateTaskStatusInVault(task, newStatus, app);
		console.log("Update status in vault result:", ok);
		if (ok) onStatusChange(newStatus);
	};

	return (
		<div
			style={{
				display: "flex",
				gap: 8,
				alignItems: "center",
			}}
		>
			<div
				onClick={handleToggleStatus}
				style={{
					width: 22,
					height: 22,
					cursor: "pointer",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				{statusIcons[status]}
			</div>
		</div>
	);
}
