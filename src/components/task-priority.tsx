import React from "react";

interface TaskPriorityProps {
	priority: string;
}

export function TaskPriority({ priority }: TaskPriorityProps) {
	return (
		<span title="Priority" className="task-priority">
			{priority}
		</span>
	);
}
