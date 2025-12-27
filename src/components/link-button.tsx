import React from "react";
import { App, FileView, TFile, WorkspaceLeaf } from "obsidian";
import { ArrowUpRight } from "lucide-react";

interface LinkButtonProps {
  taskStatus?: "todo" | "done" | "canceled" | "in_progress";
  link: string;
  app: App;
}

// Detect if the file is already opened in a leaf.
// Checks both loaded views and deferred/unactivated tabs.
function findLeafWithFile(app: App, filePath: string): WorkspaceLeaf | null {
  const leaves = app.workspace.getLeavesOfType("markdown");

  for (const leaf of leaves) {
    // Check loaded view first
    const fileView = leaf.view as FileView;
    if (fileView?.file && fileView.file.path === filePath) {
      return leaf;
    }

    // Check deferred/unactivated tabs via view state
    const state = leaf.getViewState();
    if (state?.state?.file === filePath) {
      return leaf;
    }
  }

  return null;
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
  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const abstractFile = app.vault.getAbstractFileByPath(link);

    if (!(abstractFile instanceof TFile)) {
      throw new Error(`File not found: ${link}`);
    }

    const existingLeaf = findLeafWithFile(app, link);

    if (existingLeaf) {
      await app.workspace.revealLeaf(existingLeaf);
      app.workspace.setActiveLeaf(existingLeaf, { focus: true });
    } else {
      await app.workspace.openLinkText(link, link);
    }
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
