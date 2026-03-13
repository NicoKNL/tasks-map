import React from "react";
import { TaskStatus } from "src/types/task";
import {t} from "../i18n";

interface StatusBarProps {
  totalTasks: number;
  tasksByStatus: Record<TaskStatus, number>;
  selectedStatuses: TaskStatus[];
}

export default function StatusBar({ 
  totalTasks, 
  tasksByStatus, 
  selectedStatuses 
}: StatusBarProps) {
  console.log("StatusBar rendered", { totalTasks, tasksByStatus, selectedStatuses });
  
  // If no statuses are selected, show total count
  const showDetailedCount = selectedStatuses.length > 0;
  
  // Format the status display
  const getStatusDisplay = (status: TaskStatus): string => {
    const statusMap: Record<TaskStatus, string> = {
      todo: t("status_bar.todo"),
      in_progress: t("status_bar.in_progress"),
      done: t("status_bar.done"),
      canceled: t("status_bar.canceled"),
    };
    return statusMap[status] || status;
  };

  return (
    <div className="tasks-map-status-bar">
      <div className="tasks-map-status-bar-content">
        {showDetailedCount ? (
          // Show detailed count by status
          <div className="tasks-map-status-details">
            {Object.entries(tasksByStatus)
              .filter(([status, count]) => count > 0)
              .map(([status, count]) => (
                <div key={status} className="tasks-map-status-item">
                  <span className="tasks-map-status-label">
                    {getStatusDisplay(status as TaskStatus)}:
                  </span>
                  <span className="tasks-map-status-count">{count}</span>
                </div>
              ))}
            <div className="tasks-map-total-tasks">
              {t("status_bar.total")}: {totalTasks}
            </div>
          </div>
        ) : (
          // Show only total count
          <div className="tasks-map-total-tasks">
            {t("status_bar.total")}: {totalTasks}
          </div>
        )}
      </div>
    </div>
  );
}
