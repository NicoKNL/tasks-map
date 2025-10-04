import { useEffect, useRef } from "react";

export function useSummaryRenderer(summary: string) {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.empty();
    renderSummaryWithLinks(summary, containerRef.current);
  }, [summary]);

  return containerRef;
}

function renderSummaryWithLinks(summary: string, container: HTMLElement) {
  const parts = summary.split(/(\[[^\]]+\]\([^)]+\)|\[\[[^\]]+\]\])/g);

  parts.forEach((part) => {
    const mdLinkMatch = part.match(/\[([^\]]+)\]\(([^)]+)\)/);
    if (mdLinkMatch) {
      const [, text, url] = mdLinkMatch;
      container.createEl("a", {
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
      container.createEl("a", {
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
