import React, { useState, useRef, useEffect } from "react";
import { MoreVertical, Trash2 } from "lucide-react";
import { App } from "obsidian";
import { Task } from "src/types/task";
import { deleteTaskFromVault } from "../lib/utils";

interface TaskMenuProps {
  task: Task;
  app: App;
  onTaskDeleted?: () => void;
}

export const TaskMenu = ({ task, app, onTaskDeleted }: TaskMenuProps) => {
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
