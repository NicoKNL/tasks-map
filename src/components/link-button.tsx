import React from "react";
import { App } from "obsidian";
import { ArrowUpRight } from "lucide-react";

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
      <ArrowUpRight size={16} />
    </button>
  );
};
