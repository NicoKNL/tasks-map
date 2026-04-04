import React from "react";
import { Circle, CircleDot, CircleCheck, CircleX } from "lucide-react";
import { BaseTask, TaskStatus } from "src/types/task";
import { updateTaskStatusInVault } from "src/lib/utils";
import { useApp } from "src/hooks/hooks";

interface TaskStatusProps {
  status: TaskStatus;
  task: BaseTask;
  onStatusChange: (newStatus: TaskStatus) => void; // eslint-disable-line no-unused-vars
}

const statusIcons: Record<TaskStatus, React.ReactElement> = {
  todo: <Circle size={16} />,
  in_progress: <CircleDot size={16} />,
  done: <CircleCheck size={16} />,
  canceled: <CircleX size={16} />,
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
    await updateTaskStatusInVault(task, newStatus, app);
    onStatusChange(newStatus);
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
