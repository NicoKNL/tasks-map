import React from "react";
import { TaskStatus } from "src/types/task";

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
      todo: "待办",
      in_progress: "进行中",
      done: "已完成",
      canceled: "已取消",
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
              总计: {totalTasks}
            </div>
          </div>
        ) : (
          // Show only total count
          <div className="tasks-map-total-tasks">
            任务总数: {totalTasks}
          </div>
        )}
      </div>
    </div>
  );
}
