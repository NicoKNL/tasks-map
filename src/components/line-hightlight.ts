import { App, MarkdownView, } from "obsidian";

export class LineHighlighter {
  private highlightTimeout: ReturnType<typeof setTimeout> | null = null;

  async highlightLine(app: App, lineNumber: number, delayMs: number = 1000) {
    if (!lineNumber) {return;}

    const activeView = app.workspace.getActiveViewOfType(MarkdownView);
    if (!activeView) return;

    const editor = activeView.editor;
    const cmView = (editor as any).cm;

    // Get all lines
    const lineElements = cmView.contentDOM.querySelectorAll('.cm-line');

    // Add highlight
    if (lineNumber >= 0 && lineNumber < lineElements.length) {
      const lineElement = lineElements[lineNumber] as HTMLElement;

      // Scroll to the line firstly.
      lineElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });

      lineElement.classList.add("tasks-map-line-highlight");

      // Set timeout to remove highlight
      this.highlightTimeout = setTimeout(() => {
        lineElement.classList.remove("tasks-map-line-highlight");
        this.highlightTimeout = null;
      }, delayMs);
    }
  }

  getLineElement(view: any, lineNumber: number): HTMLElement | null {
    const lineElements = view.contentDOM.querySelectorAll(".cm-line");

    if (lineNumber >= 0 && lineNumber < lineElements.length) {
      return lineElements[lineNumber] as HTMLElement;
    }

    return null;
  }

  // Clear highlight
  clearHighlight(app: App) {
    if (this.highlightTimeout) {
      clearTimeout(this.highlightTimeout);
      this.highlightTimeout = null;
    }

    const activeView = app.workspace.getActiveViewOfType(MarkdownView);
    if (activeView) {
      // const editor = activeView.editor;
      const highlights = activeView.containerEl.querySelectorAll(
        ".tasks-map-line-highlight"
      );
      highlights.forEach((el) =>
        el.classList.remove("tasks-map-line-highlight")
      );
    }
  }
}
