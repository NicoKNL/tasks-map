import React from "react";
import { App } from "obsidian";

interface LinkButtonProps {
  taskStatus?: "todo" | "done" | "canceled" | "in_progress";
  link: string;
  app: App;
}

export const LinkButton = ({
  link,
  app,
  taskStatus = "todo",
}: LinkButtonProps) => {
  const status =
    taskStatus === "done"
      ? "success"
      : taskStatus === "canceled"
        ? "error"
        : "normal";
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    app.workspace.openLinkText(link, link);
  };

  return (
    <button
      className={`tasks-map-link-button tasks-map-link-button--${status}`}
      onClick={handleClick}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d="M5 3H13V11M13 3L3 13"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
};
