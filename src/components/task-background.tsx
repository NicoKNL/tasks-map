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
				return "task-background--done";
			case "in_progress":
				return "task-background--in-progress";
			case "canceled":
				return "task-background--canceled";
			default:
				return "task-background--todo";
		}
	};

	const className = `task-background ${getStatusClass()}${
		expanded ? " task-background--expanded" : ""
	}`;

	return <div className={className}>{children}</div>;
}
