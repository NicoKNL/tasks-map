import React, { useState, useRef, useEffect } from "react";
import { MoreVertical, Trash2 } from "lucide-react";
import { App } from "obsidian";
import { BaseTask } from "src/types/task";
import { CirclePlus, SquarePen } from "lucide-react";
import {
  addTaskLineToVault,
  deleteTaskFromVault,
  findTaskLineByIdOrText,
  getTasksApi,
} from "../lib/utils";

interface TaskMenuProps {
  task: BaseTask;
  app: App;
  onTaskDeleted?: () => void;
}

const TaskMenu = ({ task, app, onTaskDeleted }: TaskMenuProps) => {
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
      document.addEventListener("mousedown", handleClickOutside, true);
      document.addEventListener("pointerdown", handleClickOutside, true);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside, true);
      document.removeEventListener("pointerdown", handleClickOutside, true);
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
  };

  const handleEdit = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsOpen(false);

    if (!task.link) return;

    const vault = app?.vault;
    if (!vault) return;

    const file = vault.getFileByPath(task.link);
    if (!file) return;

    const tasksApi = getTasksApi(app);
    if (!tasksApi) {
      console.error("Tasks plugin not found or API not available");
      return;
    }

    try {
      const fileContent = await vault.read(file);
      const lines = fileContent.split(/\r?\n/);
      const taskLineIdx = findTaskLineByIdOrText(lines, task.id, task.text);

      if (taskLineIdx === -1) {
        console.warn("Task line not found");
        return;
      }

      const taskLine = lines[taskLineIdx];
      // console.log("before: ", taskLine);

      const newTaskLine = await tasksApi.editTaskLineModal(taskLine);
      if (!newTaskLine?.trim()) {
        return;
      }
      // console.log("after: ", newTaskLine);

      lines[taskLineIdx] = newTaskLine;
      await vault.modify(file, lines.join("\n"));
    } catch (error) {
      console.error("Error processing task:", error);
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
          <button className="tasks-map-task-menu-item" onClick={handleCreate}>
            <CirclePlus size={12} />
            <span>Create task</span>
          </button>
          <button className="tasks-map-task-menu-item" onClick={handleEdit}>
            <SquarePen size={12} />
            <span>Edit task</span>
          </button>
          <button
            className="tasks-map-task-menu-item tasks-map-task-menu-item--danger"
            onClick={handleDelete}
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
