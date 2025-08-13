import React from "react";
import { TaskStatus } from "src/types/task";

interface TaskBackgroundProps {
	status: TaskStatus;
	expanded?: boolean;
	width?: number;
	height?: number;
	children: React.ReactNode;
}

export function TaskBackground({
	status,
	expanded,
	width = 250,
	height = 120,
	children,
}: TaskBackgroundProps) {
	return (
		<div
			style={{
				background:
					status === "done"
						? "var(--task-completed-green)"
						: status === "in_progress"
						? "var(--task-in-progress-blue)"
						: status === "canceled"
						? "var(--task-canceled-red)"
						: "var(--background-secondary)",
				border:
					status === "done"
						? "1px solid var(--color-green)"
						: status === "in_progress"
						? "1px solid var(--color-blue)"
						: status === "canceled"
						? "1px solid var(--color-red)"
						: "1px solid rgba(var(--color-black-rgb), 0.1)",
				borderRadius: "var(--radius-m)",
				padding: 12,
				width: width,
				minHeight: height,
				maxHeight: expanded ? undefined : height,
				boxShadow: "0 2px 8px rgba(var(--color-black-rgb),0.07)",
				fontWeight: 500,
				color:
					status === "done"
						? "var(--text-success)"
						: status === "in_progress"
						? "var(--color-blue)"
						: status === "canceled"
						? "var(--text-error)"
						: "var(--text-normal)",
				display: "flex",
				flexDirection: "column",
				gap: 4,
				position: "relative",
				transition: "max-height 0.2s, min-height 0.2s, width 0.2s",
			}}
		>
			{children}
		</div>
	);
}
