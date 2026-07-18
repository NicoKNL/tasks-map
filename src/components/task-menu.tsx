import React, { useState, useRef, useEffect } from "react";
import { MoreVertical, Trash2 } from "lucide-react";
import { App } from "obsidian";
import { BaseTask } from "src/types/task";
import { CirclePlus, SquarePen } from "lucide-react";
import {
  addTaskLineToVault,
  deleteTaskFromVault,
  editTaskWithTasksModal,
  getTasksApi,
  parseTaskLine,
} from "../lib/utils";

interface TaskMenuProps {
  task: BaseTask;
  app: App;
  onTaskDeleted?: () => void;
  onTaskCreated?: (_newTask: BaseTask) => void;
  onTaskEdited?: (_taskId: string, _updatedTask: BaseTask) => void;
}

const TaskMenu = ({
  task,
  app,
  onTaskDeleted,
  onTaskCreated,
  onTaskEdited,
}: TaskMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      // Use capture phase to catch clicks before ReactFlow handles them
      activeDocument.addEventListener("mousedown", handleClickOutside, true);
      activeDocument.addEventListener("pointerdown", handleClickOutside, true);
    }

    return () => {
      activeDocument.removeEventListener("mousedown", handleClickOutside, true);
      activeDocument.removeEventListener(
        "pointerdown",
        handleClickOutside,
        true
      );
    };
  }, [isOpen]);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleCreate = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsOpen(false);

    const tasksApi = getTasksApi(app);
    if (!tasksApi) {
      console.error("Tasks plugin not found or API not available");
      return;
    }

    const taskLine = await tasksApi.createTaskLineModal();
    if (!taskLine?.trim()) {
      return;
    }

    // Do whatever you want with the returned value.
    // It's just a string containing the Markdown for the task.
    // console.log(taskLine);
    await addTaskLineToVault(task, taskLine, app);

    const newTask = parseTaskLine(taskLine, task.link);
    if (newTask) {
      onTaskCreated?.(newTask);
    }
  };

  const handleEdit = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsOpen(false);

    const updatedTask = await editTaskWithTasksModal(task, app);
    if (updatedTask) {
      onTaskEdited?.(task.id, updatedTask);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await deleteTaskFromVault(task, app);
      onTaskDeleted?.();
    } catch (error) {
      console.error("Failed to delete task:", error);
    }

    setIsOpen(false);
  };

  return (
    <div className="tasks-map-task-menu nodrag" ref={menuRef}>
      <button
        className="tasks-map-task-menu-button"
        onClick={handleToggle}
        aria-label="Task menu"
      >
        <MoreVertical size={14} />
      </button>

      {isOpen && (
        <div className="tasks-map-task-menu-dropdown">
          <button
            className="tasks-map-task-menu-item"
            onClick={(e) => void handleCreate(e)}
          >
            <CirclePlus size={12} />
            <span>Create task</span>
          </button>
          <button
            className="tasks-map-task-menu-item"
            onClick={(e) => void handleEdit(e)}
          >
            <SquarePen size={12} />
            <span>Edit task</span>
          </button>
          <button
            className="tasks-map-task-menu-item tasks-map-task-menu-item--danger"
            onClick={(e) => void handleDelete(e)}
          >
            <Trash2 size={12} />
            <span>Delete task</span>
          </button>
        </div>
      )}
    </div>
  );
};
export default TaskMenu;
