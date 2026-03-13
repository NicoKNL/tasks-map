import React from "react";
import { BaseTask, TaskStatus } from "src/types/task";
import { updateTaskStatusInVault } from "src/lib/utils";
import { useApp } from "src/hooks/hooks";

interface TaskStatusProps {
  status: TaskStatus;
  task: BaseTask;
  onStatusChange: (newStatus: TaskStatus) => void; // eslint-disable-line no-unused-vars
}

const statusIcons = {
  todo: "⬜",
  in_progress: "🔵",
  done: "✅",
  canceled: "❌",
};

export function TaskStatusToggle({
  status,
  task,
  onStatusChange,
}: TaskStatusProps) {
  const app = useApp();

  const handleToggleStatus = async (e: React.MouseEvent) => {
    e.stopPropagation();
    // Cycle through statuses: todo -> in_progress -> done
    // (canceled status is set through a separate action)
    const statusCycle: TaskStatus[] = ["todo", "in_progress", "done"];
    const currentIndex = statusCycle.indexOf(status);
    const newStatus = statusCycle[(currentIndex + 1) % statusCycle.length];
    
    console.log("TaskStatusToggle: updating status", { 
      taskId: task.id, 
      oldStatus: status, 
      newStatus 
    });
    
    try {
      await updateTaskStatusInVault(task, newStatus, app);
      console.log("TaskStatusToggle: vault update successful, calling onStatusChange");
      onStatusChange(newStatus);
    } catch (error) {
      console.error("TaskStatusToggle: failed to update status in vault", error);
      // Still call onStatusChange to update UI?
      // Maybe we should still update the UI even if vault fails
      onStatusChange(newStatus);
    }
  };

  return (
    <div className="tasks-map-status-container">
      <div
        onClick={handleToggleStatus}
        className="tasks-map-task-status-toggle"
      >
        {statusIcons[status]}
      </div>
    </div>
  );
}
