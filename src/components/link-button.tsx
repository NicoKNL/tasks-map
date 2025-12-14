import React from "react";
import {
  App,
  Editor,
  FileView,
  MarkdownView,
  TFile,
  WorkspaceLeaf,
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

// Detect the file is opened.
function findLeafWithFile(app: any, filePath: string): WorkspaceLeaf | null {
  const leaves = app.workspace.getLeavesOfType("markdown");

  for (const leaf of leaves) {
    const fileView = leaf.view as FileView;
    if (fileView?.file && fileView.file.path === filePath) {
      return leaf;
    }
  }

  return null;
}

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
  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // app.workspace.openLinkText(link, link);

    // Try to find the file obj
    const abstractFile = app.vault.getAbstractFileByPath(link);

    if (!(abstractFile instanceof TFile)) {
      throw new Error(`File not found: ${link}`);
    }

    // Find the opened tab
    const existingLeaf = findLeafWithFile(app, link);
    let targetLeaf: WorkspaceLeaf;

    if (existingLeaf) {
      // Switch to the tab
      await app.workspace.revealLeaf(existingLeaf);
      app.workspace.setActiveLeaf(existingLeaf, { focus: true });
      targetLeaf = existingLeaf;
    } else {
      // Open in new tab
      // const newLeaf = await app.workspace.openLinkText(link, link);
      targetLeaf = app.workspace.getLeaf("tab");
      await targetLeaf.openFile(abstractFile);
    }

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
