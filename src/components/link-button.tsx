import React from "react";
import {
  App,
  MarkdownView,
} from "obsidian";
import { ArrowUpRight } from "lucide-react";
import { Task } from "../types/task";
import { findTaskLineByIdOrText } from "../lib/utils";
import { LineHighlighter } from "./line-hightlight";

interface LinkButtonProps {
  taskStatus?: "todo" | "done" | "canceled" | "in_progress";
  link: string;
  app: App;
  task: Task;
}

const highlighter = new LineHighlighter();

export const LinkButton = ({
  link,
  app,
  taskStatus = "todo",
  task,
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

    const targetLeaf = app.workspace.getLeaf();

    // Wait for the view to be fully loaded
    setTimeout(() => {
      if (targetLeaf.view instanceof MarkdownView) {
        const editor = targetLeaf.view.editor;

        if (editor && task?.text) {
          // Search for the exact task text in the document
          const content = editor.getValue();

          // Find the line containing the task text
          const lines = content.split("\n");

          const lineIdx = findTaskLineByIdOrText(lines, task.id, task.text);

          // Highlight the line
          highlighter.highlightLine(app, lineIdx, 2000);
        }
      }
    }, 100); // Small delay to ensure the editor is fully loaded
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
