import React from "react";
import { TaskStatus } from "src/types/task";

interface TaskBackgroundProps {
	status: TaskStatus;
	expanded?: boolean;
	children: React.ReactNode;
}

export function TaskBackground({
	status,
	expanded,
	children,
}: TaskBackgroundProps) {
	const getStatusClass = () => {
		switch (status) {
			case "done":
				return "tasks-map-task-background--done";
			case "in_progress":
				return "tasks-map-task-background--in-progress";
			case "canceled":
				return "tasks-map-task-background--canceled";
			default:
				return "tasks-map-task-background--todo";
		}
	};

	const className = `tasks-map-task-background ${getStatusClass()}${
		expanded ? " tasks-map-task-background--expanded" : ""
	}`;

	return <div className={className}>{children}</div>;
}
