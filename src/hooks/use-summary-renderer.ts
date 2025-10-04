import { useEffect, useRef } from "react";

// Hook to render summary with links using Obsidian's DOM API
export function useSummaryRenderer(summary: string) {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear existing content
    containerRef.current.empty();

    // Parse and render the summary with links
    renderSummaryWithLinks(summary, containerRef.current);
  }, [summary]);

  return containerRef;
}

function renderSummaryWithLinks(summary: string, container: HTMLElement) {
  // Split the text by markdown and obsidian link patterns
  const parts = summary.split(/(\[[^\]]+\]\([^)]+\)|\[\[[^\]]+\]\])/g);

  parts.forEach((part) => {
    // Check if it's a markdown link [text](url)
    const mdLinkMatch = part.match(/\[([^\]]+)\]\(([^)]+)\)/);
    if (mdLinkMatch) {
      const [, text, url] = mdLinkMatch;
      const link = container.createEl("a", {
        text: text,
        href: url,
        attr: {
          target: "_blank",
          rel: "noopener noreferrer",
        },
      });
      return;
    }

    // Check if it's an obsidian link [[file]]
    const obsidianLinkMatch = part.match(/\[\[([^\]]+)\]\]/);
    if (obsidianLinkMatch) {
      const [, file] = obsidianLinkMatch;
      const link = container.createEl("a", {
        text: file,
        href: `obsidian://open?path=${encodeURIComponent(file.replace(/\s/g, " "))}`,
      });
      return;
    }

    // Regular text
    if (part.trim()) {
      container.createSpan({ text: part });
    }
  });
}
