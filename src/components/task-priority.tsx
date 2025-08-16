import React from "react";

interface TaskPriorityProps {
	priority: string;
	style?: React.CSSProperties;
}

export function TaskPriority({ priority, style }: TaskPriorityProps) {
	return (
		<span
			title="Priority"
			style={{
				fontSize: 18,
				lineHeight: 1,
				cursor: "pointer",
				...style,
			}}
		>
			{priority}
		</span>
	);
}
