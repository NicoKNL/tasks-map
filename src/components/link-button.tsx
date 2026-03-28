import React from "react";
import {
  App,
  Editor,
  FileView,
  MarkdownView,
  TFile,
  WorkspaceLeaf,
  OpenViewState,
} from "obsidian";
import { ArrowUpRight } from "lucide-react";
import { findTaskLineByIdOrText } from "../lib/utils";
import { BaseTask } from "../types/base-task";

interface LinkButtonProps {
  taskStatus?: "todo" | "done" | "canceled" | "in_progress";
  link: string;
  app: App;
  task: BaseTask;
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

/**
 * Scroll to and select the specified line in the editor
 */
async function scrollAndSelect(editor: Editor, lineIdx: number): Promise<void> {
  // First scroll to the line
  editor.scrollIntoView(
    {
      from: { line: lineIdx, ch: 0 },
      to: { line: lineIdx, ch: 0 },
    },
    true
  );

  // Wait for next animation frame to ensure scroll has taken effect
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

  // Set cursor and select the line
  editor.setCursor({ line: lineIdx, ch: 0 });
  const lineLength = editor.getLine(lineIdx).length;
  editor.setSelection(
    { line: lineIdx, ch: 0 },
    { line: lineIdx, ch: lineLength }
  );
}

/**
 * Try to highlight the task in an already opened leaf
 */
async function highlightTaskInLeaf(
  leaf: WorkspaceLeaf,
  task: BaseTask
): Promise<boolean> {
  if (!(leaf.view instanceof MarkdownView)) {
    return false;
  }

  const markdownView = leaf.view as MarkdownView;
  
  // Check if we're in source mode (has editor)
  if (markdownView.getMode() === "source") {
    const editor = markdownView.editor;
    if (!editor || !task?.text) {
      return false;
    }

    // Search for the exact task text in the document
    const content = editor.getValue();
    const lines = content.split("\n");
    let lineIdx = findTaskLineByIdOrText(lines, task.id, task.text);

    if (lineIdx === -1) {
      return false; // Task not found
    }

    await scrollAndSelect(editor, lineIdx);
    return true;
  } else {
    // We're in preview mode - can't programmatically scroll in preview mode
    // Obsidian doesn't provide API to scroll in preview mode
    return false;
  }
}

/**
 * Wait for editor to be ready with retry mechanism
 */
async function waitForEditorReady(
  leaf: WorkspaceLeaf,
  maxRetries: number = 10,
  retryDelay: number = 100
): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    if (leaf.view instanceof MarkdownView) {
      const markdownView = leaf.view as MarkdownView;
      if (markdownView.getMode() === "source" && markdownView.editor) {
        return true;
      }
    }
    
    if (i < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
  
  return false;
}

/**
 * Open file with line position using OpenViewState if possible
 */
async function openFileAtLine(
  app: App,
  filePath: string,
  lineIdx: number
): Promise<WorkspaceLeaf | null> {
  const abstractFile = app.vault.getAbstractFileByPath(filePath);
  
  if (!(abstractFile instanceof TFile)) {
    return null;
  }

  // Try to use OpenViewState with eState to pass line information
  // Obsidian may support passing cursor position through eState
  const openViewState: OpenViewState = {
    active: true,
    eState: {
      cursor: {
        from: { line: lineIdx, ch: 0 },
        to: { line: lineIdx, ch: 0 },
      }
    }
  };

  try {
    // First check if file is already open
    const existingLeaf = findLeafWithFile(app, filePath);
    if (existingLeaf) {
      await app.workspace.revealLeaf(existingLeaf);
      app.workspace.setActiveLeaf(existingLeaf, { focus: true });
      
      // Try to scroll to the line in the existing leaf
      if (await waitForEditorReady(existingLeaf)) {
        const markdownView = existingLeaf.view as MarkdownView;
        if (markdownView.getMode() === "source" && markdownView.editor) {
          await scrollAndSelect(markdownView.editor, lineIdx);
        }
      }
      
      return existingLeaf;
    } else {
      // Open the file with the openViewState
      await app.workspace.openLinkText(filePath, filePath, false, openViewState);
      
      // Find the leaf that was just opened
      const newLeaf = findLeafWithFile(app, filePath);
      if (newLeaf && await waitForEditorReady(newLeaf)) {
        // The eState might have already positioned the cursor, but we'll try to ensure it
        const markdownView = newLeaf.view as MarkdownView;
        if (markdownView.getMode() === "source" && markdownView.editor) {
          // Double-check and adjust if needed
          await new Promise(resolve => setTimeout(resolve, 50));
          await scrollAndSelect(markdownView.editor, lineIdx);
        }
      }
      
      return newLeaf;
    }
  } catch (error) {
    console.error("Error opening file at line:", error);
    // Fallback to simple open
    await app.workspace.openLinkText(filePath, filePath);
    return findLeafWithFile(app, filePath);
  }
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

    // Try to find the task line in the file
    const abstractFile = app.vault.getAbstractFileByPath(link);
    if (!(abstractFile instanceof TFile)) {
      throw new Error(`File not found: ${link}`);
    }

    // Read the file to find the line number
    let lineIdx = -1;
    try {
      const content = await app.vault.read(abstractFile);
      const lines = content.split("\n");
      lineIdx = findTaskLineByIdOrText(lines, task.id, task.text);
    } catch (error) {
      console.error("Error reading file to find task line:", error);
    }

    if (lineIdx === -1) {
      // Task not found in file, just open the file
      await app.workspace.openLinkText(link, link);
      return;
    }

    // Try to open the file at the specific line
    await openFileAtLine(app, link, lineIdx);
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
