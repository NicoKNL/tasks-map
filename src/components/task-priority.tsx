import React from "react";

interface TaskPriorityProps {
	priority: string;
}

export function TaskPriority({ priority }: TaskPriorityProps) {
	return (
		<span title="Priority" className="tasks-map-task-priority">
			{priority}
		</span>
	);
}
