import React from "react";

interface TaskPriorityProps {
	priority: string;
	style?: React.CSSProperties;
}

export function TaskPriority({ priority, style }: TaskPriorityProps) {
	return (
		<span title="Priority" className="task-priority" style={style}>
			{priority}
		</span>
	);
}
