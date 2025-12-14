import React from "react";
import { App, MarkdownView } from "obsidian";
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

          let lineIdx = findTaskLineByIdOrText(lines, task.id, task.text);

          console.info("lineIdx: ", lineIdx);
          lineIdx = getAdjustedSourceLine(app, lineIdx);

          // Highlight the line
          highlighter.highlightLine(app, lineIdx, 2000);
        }
      }
    }, 200); // Small delay to ensure the editor is fully loaded
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

const getAdjustedSourceLine = (app: App, renderedLine: number): number => {
  const markdownView = app.workspace.getActiveViewOfType(MarkdownView);
  if (!markdownView) {
    console.warn("No active markdown editor");
    return renderedLine;
  }
  const currentMode = markdownView.getMode();

  // If in "source", default live source
  if (currentMode === "source") {
    const editor = markdownView.editor;
    const content = editor.getValue();
    const lines = content.split("\n");

    const frontmatterEndLine = findFrontmatterEndLine(lines);

    const safeLine = Math.min(renderedLine, lines.length - 1);

    return safeLine - frontmatterEndLine;
  }

  // In preview
  if (currentMode === "preview") {
    // TODO: preview
    return renderedLine;
  }

  console.warn(`Unknown Mode: ${currentMode}`);
  return renderedLine;
};

const findFrontmatterEndLine = (lines: string[]): number => {
  if (lines.length < 2 || lines[0] !== "---") {
    return 0;
  }

  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === "---") {
      return i + 1;
    }
  }

  return 0;
};
