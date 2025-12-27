import { useEffect, useRef } from "react";
import { App, FileView, WorkspaceLeaf } from "obsidian";

export function useSummaryRenderer(summary: string, app?: App) {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.empty();
    renderSummaryWithLinks(summary, containerRef.current, app);
  }, [summary, app]);

  return containerRef;
}

/**
 * Find a leaf that already has the given file open.
 * Checks both loaded views and deferred/unactivated tabs.
 */
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
 * Open a file in Obsidian, reusing existing leaf if already open
 */
async function openFileInObsidian(app: App, filePath: string): Promise<void> {
  // Try to resolve the file path (handles both with and without .md extension)
  const resolvedFile = app.metadataCache.getFirstLinkpathDest(filePath, "");
  const targetPath = resolvedFile?.path || filePath;

  const existingLeaf = findLeafWithFile(app, targetPath);

  if (existingLeaf) {
    await app.workspace.revealLeaf(existingLeaf);
    app.workspace.setActiveLeaf(existingLeaf, { focus: true });
  } else {
    await app.workspace.openLinkText(filePath, "");
  }
}

function renderSummaryWithLinks(
  summary: string,
  container: HTMLElement,
  app?: App
) {
  // Split by links and inline code blocks
  const parts = summary.split(/(\[[^\]]+\]\([^)]+\)|\[\[[^\]]+\]\]|`[^`]+`)/g);

  parts.forEach((part) => {
    const mdLinkMatch = part.match(/\[([^\]]+)\]\(([^)]+)\)/);
    if (mdLinkMatch) {
      const [, text, url] = mdLinkMatch;
      container.createEl("a", {
        text: text,
        href: url,
        cls: "tasks-map-link",
        attr: {
          target: "_blank",
          rel: "noopener noreferrer",
        },
      });
      return;
    }

    // Check if it's an obsidian link [[file]] or [[file|alias]]
    const obsidianLinkMatch = part.match(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/);
    if (obsidianLinkMatch) {
      const [, file, alias] = obsidianLinkMatch;
      const displayText = alias || file;
      const link = container.createEl("a", {
        text: displayText,
        cls: "tasks-map-link internal-link",
      });

      link.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (app) {
          openFileInObsidian(app, file);
        }
      });
      return;
    }

    // Check if it's inline code `text`
    const inlineCodeMatch = part.match(/^`([^`]+)`$/);
    if (inlineCodeMatch) {
      const [, code] = inlineCodeMatch;
      container.createEl("code", {
        text: code,
        cls: "tasks-map-inline-code",
      });
      return;
    }

    // Regular text
    if (part.trim()) {
      container.createSpan({ text: part });
    }
  });
}
