import React, { useMemo } from "react";
import { BaseTask, TaskStatus } from "src/types/task";

const statusIcons: Record<TaskStatus, string> = {
  todo: "⬜",
  in_progress: "🔵",
  done: "✅",
  canceled: "❌",
};

const ALL_STATUSES: TaskStatus[] = ["todo", "in_progress", "done", "canceled"];

interface StatusCountsOverlayProps {
  tasks: BaseTask[];
}

export default function StatusCountsOverlay({
  tasks,
}: StatusCountsOverlayProps) {
  const counts = useMemo(() => {
    const map: Record<TaskStatus, number> = {
      todo: 0,
      in_progress: 0,
      done: 0,
      canceled: 0,
    };
    for (const task of tasks) {
      map[task.status]++;
    }
    return map;
  }, [tasks]);

  return (
    <div className="tasks-map-status-counts-overlay">
      {ALL_STATUSES.map((status) => (
        <div key={status} className="tasks-map-status-counts-item">
          <span className="tasks-map-status-counts-icon">
            {statusIcons[status]}
          </span>
          <span className="tasks-map-status-counts-value">
            {counts[status]}
          </span>
        </div>
      ))}
    </div>
  );
}
