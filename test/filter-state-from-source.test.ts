import { filterStateFromSource } from "../src/views/TaskMapGraphEmbedView";
import { DEFAULT_FILTER_STATE } from "../src/types/filter-state";
import { DEFAULT_EMBED_CONFIG } from "../src/types/embed-config";

describe("filterStateFromSource", () => {
  describe("empty / whitespace source", () => {
    it("returns ok with defaults for an empty string", () => {
      const result = filterStateFromSource("");
      expect(result.kind).toBe("ok");
      if (result.kind !== "ok") return;
      expect(result.filter).toEqual(DEFAULT_FILTER_STATE);
      expect(result.config).toEqual(DEFAULT_EMBED_CONFIG);
    });

    it("returns ok with defaults for a whitespace-only string", () => {
      const result = filterStateFromSource("   \n  ");
      expect(result.kind).toBe("ok");
      if (result.kind !== "ok") return;
      expect(result.filter).toEqual(DEFAULT_FILTER_STATE);
      expect(result.config).toEqual(DEFAULT_EMBED_CONFIG);
    });
  });

  describe("valid {filter, config} source", () => {
    it("merges provided filter fields with defaults", () => {
      const source = JSON.stringify({
        filter: { selectedTags: ["work"], onlyStarred: true },
        config: {},
      });
      const result = filterStateFromSource(source);
      expect(result.kind).toBe("ok");
      if (result.kind !== "ok") return;
      expect(result.filter.selectedTags).toEqual(["work"]);
      expect(result.filter.onlyStarred).toBe(true);
      // unspecified fields fall back to defaults
      expect(result.filter.excludedTags).toEqual(
        DEFAULT_FILTER_STATE.excludedTags
      );
      expect(result.filter.selectedStatuses).toEqual(
        DEFAULT_FILTER_STATE.selectedStatuses
      );
    });

    it("merges provided config fields with defaults", () => {
      const source = JSON.stringify({
        filter: {},
        config: { height: 600, showMinimap: false },
      });
      const result = filterStateFromSource(source);
      expect(result.kind).toBe("ok");
      if (result.kind !== "ok") return;
      expect(result.config.height).toBe(600);
      expect(result.config.showMinimap).toBe(false);
      // unspecified config fields fall back to defaults
      expect(result.config.showFilterPanel).toBe(
        DEFAULT_EMBED_CONFIG.showFilterPanel
      );
    });

    it("uses defaults when filter and config are omitted but keys are present", () => {
      const source = JSON.stringify({ filter: {}, config: {} });
      const result = filterStateFromSource(source);
      expect(result.kind).toBe("ok");
      if (result.kind !== "ok") return;
      expect(result.filter).toEqual(DEFAULT_FILTER_STATE);
      expect(result.config).toEqual(DEFAULT_EMBED_CONFIG);
    });
  });

  describe("empty object {} source", () => {
    it("returns legacy for an empty object (no filter/config keys)", () => {
      const result = filterStateFromSource("{}");
      // {} has no filter or config keys and no other keys → legacy
      expect(result.kind).toBe("legacy");
    });
  });

  describe("legacy flat format", () => {
    it("returns legacy for a flat object with unrecognised top-level keys", () => {
      const source = JSON.stringify({
        selectedTags: ["tag1"],
        onlyStarred: true,
      });
      const result = filterStateFromSource(source);
      expect(result.kind).toBe("legacy");
    });
  });

  describe("invalid JSON", () => {
    it("returns invalid for unparseable JSON", () => {
      const result = filterStateFromSource("{ not valid json }");
      expect(result.kind).toBe("invalid");
    });

    it("returns invalid for a JSON array", () => {
      const result = filterStateFromSource("[1, 2, 3]");
      expect(result.kind).toBe("invalid");
    });

    it("returns invalid for a JSON primitive string", () => {
      const result = filterStateFromSource('"just a string"');
      expect(result.kind).toBe("invalid");
    });

    it("returns invalid for a JSON null", () => {
      const result = filterStateFromSource("null");
      expect(result.kind).toBe("invalid");
    });
  });

  describe("runtime coercion of config fields", () => {
    it("falls back to default height when height is null", () => {
      const source = JSON.stringify({ filter: {}, config: { height: null } });
      const result = filterStateFromSource(source);
      expect(result.kind).toBe("ok");
      if (result.kind !== "ok") return;
      expect(result.config.height).toBe(DEFAULT_EMBED_CONFIG.height);
    });

    it("falls back to default height when height is a negative number", () => {
      const source = JSON.stringify({ filter: {}, config: { height: -100 } });
      const result = filterStateFromSource(source);
      expect(result.kind).toBe("ok");
      if (result.kind !== "ok") return;
      expect(result.config.height).toBe(DEFAULT_EMBED_CONFIG.height);
    });

    it("falls back to default height when height is zero", () => {
      const source = JSON.stringify({ filter: {}, config: { height: 0 } });
      const result = filterStateFromSource(source);
      expect(result.kind).toBe("ok");
      if (result.kind !== "ok") return;
      expect(result.config.height).toBe(DEFAULT_EMBED_CONFIG.height);
    });

    it('falls back to default showMinimap when value is the string "false"', () => {
      const source = JSON.stringify({
        filter: {},
        config: { showMinimap: "false" },
      });
      const result = filterStateFromSource(source);
      expect(result.kind).toBe("ok");
      if (result.kind !== "ok") return;
      expect(result.config.showMinimap).toBe(DEFAULT_EMBED_CONFIG.showMinimap);
    });

    it("falls back to default selectedTags when value is a plain string", () => {
      const source = JSON.stringify({
        filter: { selectedTags: "tag1" },
        config: {},
      });
      const result = filterStateFromSource(source);
      expect(result.kind).toBe("ok");
      if (result.kind !== "ok") return;
      expect(result.filter.selectedTags).toEqual(
        DEFAULT_FILTER_STATE.selectedTags
      );
    });

    it("falls back to default traversalMode for an invalid value", () => {
      const source = JSON.stringify({
        filter: { traversalMode: "invalid_mode" },
        config: {},
      });
      const result = filterStateFromSource(source);
      expect(result.kind).toBe("ok");
      if (result.kind !== "ok") return;
      expect(result.filter.traversalMode).toBe(
        DEFAULT_FILTER_STATE.traversalMode
      );
    });

    it("accepts a valid traversalMode value", () => {
      const source = JSON.stringify({
        filter: { traversalMode: "upstream" },
        config: {},
      });
      const result = filterStateFromSource(source);
      expect(result.kind).toBe("ok");
      if (result.kind !== "ok") return;
      expect(result.filter.traversalMode).toBe("upstream");
    });

    it("falls back to default selectedStatuses when array contains an unknown status", () => {
      const source = JSON.stringify({
        filter: { selectedStatuses: ["todo", "unknown_status"] },
        config: {},
      });
      const result = filterStateFromSource(source);
      expect(result.kind).toBe("ok");
      if (result.kind !== "ok") return;
      expect(result.filter.selectedStatuses).toEqual(
        DEFAULT_FILTER_STATE.selectedStatuses
      );
    });

    it("accepts a valid selectedStatuses array", () => {
      const source = JSON.stringify({
        filter: { selectedStatuses: ["todo", "done"] },
        config: {},
      });
      const result = filterStateFromSource(source);
      expect(result.kind).toBe("ok");
      if (result.kind !== "ok") return;
      expect(result.filter.selectedStatuses).toEqual(["todo", "done"]);
    });
  });

  describe("edge cases", () => {
    it("handles filter/config values that are non-object types gracefully", () => {
      const source = JSON.stringify({ filter: "bad", config: 42 });
      const result = filterStateFromSource(source);
      expect(result.kind).toBe("ok");
      if (result.kind !== "ok") return;
      expect(result.filter).toEqual(DEFAULT_FILTER_STATE);
      expect(result.config).toEqual(DEFAULT_EMBED_CONFIG);
    });

    it("handles filter/config values that are arrays gracefully", () => {
      const source = JSON.stringify({ filter: [], config: [] });
      const result = filterStateFromSource(source);
      expect(result.kind).toBe("ok");
      if (result.kind !== "ok") return;
      expect(result.filter).toEqual(DEFAULT_FILTER_STATE);
      expect(result.config).toEqual(DEFAULT_EMBED_CONFIG);
    });
  });
});
