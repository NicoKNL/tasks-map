import React from "react";
import { TaskStatus } from "src/types/task";

interface TaskBackgroundProps {
  status: TaskStatus;
  starred?: boolean;
  expanded?: boolean;
  debugVisualization?: boolean;
  selected?: boolean;
  children: React.ReactNode;
}

export function TaskBackground({
  status,
  starred = false,
  expanded,
  debugVisualization,
  selected = false,
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

  const className = [
    "tasks-map-task-background",
    getStatusClass(),
    starred && "tasks-map-task-background--starred",
    expanded && "tasks-map-task-background--expanded",
    debugVisualization && "tasks-map-task-background--debug",
    selected && "tasks-map-task-background--selected",
  ]
    .filter(Boolean)
    .join(" ");

  return <div className={className}>{children}</div>;
}
