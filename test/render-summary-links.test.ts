import { renderSummaryLinks } from "../src/lib/render-summary-links";

describe("renderSummaryLinks", () => {
  it("converts markdown links to HTML anchors", () => {
    const result = renderSummaryLinks("Check [docs](https://example.com)");
    expect(result).toContain(
      '<a href="https://example.com" target="_blank" rel="noopener noreferrer">docs</a>'
    );
  });

  it("converts obsidian wiki links to plain text", () => {
    const result = renderSummaryLinks("See [[My Note]]");
    expect(result).toContain("My Note");
    expect(result).not.toContain("[[");
    expect(result).not.toContain("]]");
  });

  it("handles multiple links", () => {
    const result = renderSummaryLinks(
      "[a](http://a.com) and [b](http://b.com)"
    );
    expect(result).toContain('<a href="http://a.com"');
    expect(result).toContain('<a href="http://b.com"');
  });

  it("returns text unchanged when no links", () => {
    expect(renderSummaryLinks("plain text")).toBe("plain text");
  });

  it("handles mixed link types", () => {
    const result = renderSummaryLinks(
      "See [docs](https://example.com) and [[Internal Note]]"
    );
    expect(result).toContain("docs</a>");
    expect(result).toContain("Internal Note");
    expect(result).not.toContain("[[");
  });
});
