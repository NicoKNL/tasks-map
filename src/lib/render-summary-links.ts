// Utility to convert markdown/obsidian links to HTML <a> tags
export function renderSummaryLinks(summary: string): string {
  // [text](link) => <a href="link" target="_blank" rel="noopener noreferrer">text</a>
  const mdLink = /\[([^\]]+)\]\(([^)]+)\)/g;
  // [[other obsidian file]] => <a href="...">other obsidian file</a>
  const obsidianLink = /\[\[([^\]]+)\]\]/g;

  return summary
    .replace(mdLink, (_match, text, link) => `<a href="${link}" target="_blank" rel="noopener noreferrer">${text}</a>`)
    .replace(obsidianLink, (_match, file) => {
      return `${file}`;
    });
}
