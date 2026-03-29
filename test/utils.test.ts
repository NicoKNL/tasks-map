import {
  addDateToTask,
  removeDateFromTask,
  getTodayDate,
  findTaskLineByIdOrText,
  getTagColor,
  createNodesFromTasks,
  createEdgesFromTasks,
  checkDataviewPlugin,
  estimateNodeDimensions,
} from "../src/lib/utils";
import { NoteTask } from "../src/types/note-task";

function makeTask(
  overrides: Partial<ConstructorParameters<typeof NoteTask>[0]> = {}
): NoteTask {
  return new NoteTask({
    id: "abc123",
    summary: "Test task",
    text: "Test task",
    tags: [],
    status: "todo",
    priority: "",
    link: "tasks/test.md",
    incomingLinks: [],
    starred: false,
    ...overrides,
  });
}

describe("addDateToTask", () => {
  it("adds an emoji-format due date to a plain task", () => {
    const result = addDateToTask("- [ ] My task", "due", "2025-01-15");
    expect(result).toContain("📅 2025-01-15");
  });

  it("adds a done date", () => {
    const result = addDateToTask("- [x] Done task", "done", "2025-03-01");
    expect(result).toContain("✅ 2025-03-01");
  });

  it("adds a start date", () => {
    const result = addDateToTask("- [/] In progress", "start", "2025-02-01");
    expect(result).toContain("🛫 2025-02-01");
  });

  it("adds a scheduled date", () => {
    const result = addDateToTask("- [ ] Plan it", "scheduled", "2025-06-01");
    expect(result).toContain("⏳ 2025-06-01");
  });

  it("adds a created date", () => {
    const result = addDateToTask("- [ ] New task", "created", "2025-01-01");
    expect(result).toContain("➕ 2025-01-01");
  });

  it("adds a canceled date", () => {
    const result = addDateToTask(
      "- [-] Canceled task",
      "canceled",
      "2025-04-01"
    );
    expect(result).toContain("❌ 2025-04-01");
  });

  it("uses dataview format when existing content has dataview format", () => {
    const result = addDateToTask(
      "- [ ] My task [[start::2025-01-01]]",
      "due",
      "2025-06-15"
    );
    expect(result).toContain("[[due::2025-06-15]]");
  });

  it("replaces existing date of same type", () => {
    const line = "- [ ] My task 📅 2025-01-01";
    const result = addDateToTask(line, "due", "2025-12-31");
    expect(result).toContain("📅 2025-12-31");
    // Should not contain the old date
    expect(result).not.toContain("2025-01-01");
  });

  it("throws on empty task line", () => {
    expect(() => addDateToTask("", "due", "2025-01-01")).toThrow(
      "Task line cannot be empty"
    );
  });

  it("throws on whitespace-only task line", () => {
    expect(() => addDateToTask("   ", "due", "2025-01-01")).toThrow(
      "Task line cannot be empty"
    );
  });

  it("throws on invalid date type", () => {
    expect(() => addDateToTask("- [ ] task", "invalid", "2025-01-01")).toThrow(
      "Invalid date type"
    );
  });
});

describe("removeDateFromTask", () => {
  it("removes emoji-format due date", () => {
    const line = "- [ ] My task 📅 2025-01-15";
    const result = removeDateFromTask(line, "due");
    expect(result).not.toContain("📅");
    expect(result).toContain("My task");
  });

  it("removes done date", () => {
    const line = "- [x] Done task ✅ 2025-03-01";
    const result = removeDateFromTask(line, "done");
    expect(result).not.toContain("✅");
  });

  it("removes dataview-format date", () => {
    const line = "- [ ] My task [[due::2025-01-15]]";
    const result = removeDateFromTask(line, "due");
    expect(result).not.toContain("[[due::");
  });

  it("returns empty string for empty input", () => {
    expect(removeDateFromTask("", "due")).toBe("");
  });

  it("throws on invalid date type", () => {
    expect(() => removeDateFromTask("- [ ] task", "invalid")).toThrow(
      "Invalid date type"
    );
  });

  it("preserves other content when removing date", () => {
    const line = "- [ ] My task #tag 📅 2025-01-15 🆔 abc123";
    const result = removeDateFromTask(line, "due");
    expect(result).toContain("My task");
    expect(result).toContain("#tag");
    expect(result).toContain("🆔 abc123");
  });

  it("cleans up double spaces after removal", () => {
    const line = "- [ ] My task 📅 2025-01-15 #tag";
    const result = removeDateFromTask(line, "due");
    expect(result).not.toContain("  ");
  });
});

describe("getTodayDate", () => {
  it("returns a date in YYYY-MM-DD format", () => {
    const result = getTodayDate();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("returns today's date", () => {
    const now = new Date();
    const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    expect(getTodayDate()).toBe(expected);
  });
});

describe("findTaskLineByIdOrText", () => {
  it("finds by emoji ID", () => {
    const lines = [
      "# Header",
      "- [ ] Some task 🆔 abc123",
      "- [ ] Another task",
    ];
    expect(findTaskLineByIdOrText(lines, "abc123", "Some task")).toBe(1);
  });

  it("finds by dataview bracket ID", () => {
    const lines = [
      "# Header",
      "- [ ] Some task [id:: def456]",
      "- [ ] Another task",
    ];
    expect(findTaskLineByIdOrText(lines, "def456", "Some task")).toBe(1);
  });

  it("falls back to text matching", () => {
    const lines = [
      "# Header",
      "- [ ] Some task with no ID",
      "- [ ] Another task",
    ];
    expect(
      findTaskLineByIdOrText(lines, "nonexistent", "Some task with no ID")
    ).toBe(1);
  });

  it("returns -1 when not found", () => {
    const lines = ["# Header", "- [ ] Some task"];
    expect(findTaskLineByIdOrText(lines, "xyz", "not here")).toBe(-1);
  });
});

describe("getTagColor", () => {
  it("returns static color when mode is static", () => {
    expect(getTagColor("any-tag", "static", 42, "#ff0000")).toBe("#ff0000");
  });

  it("returns HSL color when mode is random", () => {
    const color = getTagColor("frontend", "random");
    expect(color).toMatch(/^hsl\(\d+, 65%, 45%\)$/);
  });

  it("returns consistent colors for the same tag and seed", () => {
    const color1 = getTagColor("frontend", "random", 42);
    const color2 = getTagColor("frontend", "random", 42);
    expect(color1).toBe(color2);
  });

  it("returns different colors for different tags", () => {
    const color1 = getTagColor("frontend", "random", 42);
    const color2 = getTagColor("backend", "random", 42);
    expect(color1).not.toBe(color2);
  });

  it("returns different colors with different seeds", () => {
    const color1 = getTagColor("frontend", "random", 1);
    const color2 = getTagColor("frontend", "random", 999);
    expect(color1).not.toBe(color2);
  });
});

describe("estimateNodeDimensions", () => {
  it("returns at least minimum height for short summary", () => {
    const task = makeTask({ summary: "Hi" });
    const dims = estimateNodeDimensions(task);
    expect(dims.height).toBeGreaterThanOrEqual(60);
    expect(dims.width).toBeGreaterThan(0);
  });

  it("increases height for long summary", () => {
    const shortTask = makeTask({ summary: "Short" });
    const longTask = makeTask({
      summary:
        "This is a very long task summary that should wrap to multiple lines in the node",
    });
    const shortDims = estimateNodeDimensions(shortTask);
    const longDims = estimateNodeDimensions(longTask);
    expect(longDims.height).toBeGreaterThanOrEqual(shortDims.height);
  });

  it("increases height when tags are shown", () => {
    const task = makeTask({ tags: ["a", "b", "c", "d", "e"] });
    const withTags = estimateNodeDimensions(task, true);
    const withoutTags = estimateNodeDimensions(task, false);
    expect(withTags.height).toBeGreaterThanOrEqual(withoutTags.height);
  });

  it("does not add tag height when no tags", () => {
    const task = makeTask({ tags: [] });
    const withTags = estimateNodeDimensions(task, true);
    const withoutTags = estimateNodeDimensions(task, false);
    expect(withTags.height).toBe(withoutTags.height);
  });
});

describe("createNodesFromTasks", () => {
  it("creates one node per task", () => {
    const tasks = [makeTask({ id: "a" }), makeTask({ id: "b" })];
    const nodes = createNodesFromTasks(tasks);
    expect(nodes).toHaveLength(2);
    expect(nodes[0].id).toBe("a");
    expect(nodes[1].id).toBe("b");
  });

  it("sets task data on nodes", () => {
    const task = makeTask({ id: "x" });
    const nodes = createNodesFromTasks([task]);
    expect(nodes[0].data.task).toBe(task);
    expect(nodes[0].type).toBe("task");
  });

  it("respects layout direction", () => {
    const task = makeTask();
    const horizontal = createNodesFromTasks([task], "Horizontal");
    const vertical = createNodesFromTasks([task], "Vertical");
    expect(horizontal[0].sourcePosition).not.toBe(vertical[0].sourcePosition);
  });

  it("passes through display options", () => {
    const task = makeTask();
    const nodes = createNodesFromTasks(
      [task],
      "Horizontal",
      false,
      false,
      true,
      "static",
      99,
      "#aabbcc"
    );
    expect(nodes[0].data.showPriorities).toBe(false);
    expect(nodes[0].data.showTags).toBe(false);
    expect(nodes[0].data.debugVisualization).toBe(true);
    expect(nodes[0].data.tagColorMode).toBe("static");
    expect(nodes[0].data.tagColorSeed).toBe(99);
    expect(nodes[0].data.tagStaticColor).toBe("#aabbcc");
  });
});

describe("createEdgesFromTasks", () => {
  it("creates edges from incoming links", () => {
    const tasks = [
      makeTask({ id: "A", incomingLinks: [] }),
      makeTask({ id: "B", incomingLinks: ["A"] }),
    ];
    const edges = createEdgesFromTasks(tasks);
    expect(edges).toHaveLength(1);
    expect(edges[0].source).toBe("A");
    expect(edges[0].target).toBe("B");
  });

  it("creates multiple edges for multiple dependencies", () => {
    const tasks = [
      makeTask({ id: "A", incomingLinks: [] }),
      makeTask({ id: "B", incomingLinks: [] }),
      makeTask({ id: "C", incomingLinks: ["A", "B"] }),
    ];
    const edges = createEdgesFromTasks(tasks);
    expect(edges).toHaveLength(2);
  });

  it("returns empty array when no dependencies", () => {
    const tasks = [makeTask({ id: "A" }), makeTask({ id: "B" })];
    const edges = createEdgesFromTasks(tasks);
    expect(edges).toHaveLength(0);
  });

  it("includes hash data on edges", () => {
    const tasks = [
      makeTask({ id: "A", incomingLinks: [] }),
      makeTask({ id: "B", incomingLinks: ["A"] }),
    ];
    const edges = createEdgesFromTasks(tasks);
    expect(edges[0].data?.hash).toBe("A-B");
  });

  it("passes edge style options", () => {
    const tasks = [
      makeTask({ id: "A", incomingLinks: [] }),
      makeTask({ id: "B", incomingLinks: ["A"] }),
    ];
    const edges = createEdgesFromTasks(
      tasks,
      "Vertical",
      true,
      "SmoothStep",
      20
    );
    expect(edges[0].data?.layoutDirection).toBe("Vertical");
    expect(edges[0].data?.debugVisualization).toBe(true);
    expect(edges[0].data?.edgeStyle).toBe("SmoothStep");
    expect(edges[0].data?.smoothStepRadius).toBe(20);
  });
});

describe("checkDataviewPlugin", () => {
  it("detects when plugin is not installed", () => {
    const app = { plugins: { manifests: {}, enabledPlugins: new Set() } };
    const result = checkDataviewPlugin(app);
    expect(result.isInstalled).toBe(false);
    expect(result.isReady).toBe(false);
    expect(result.getMessage()).not.toBeNull();
  });

  it("detects when plugin is installed but not enabled", () => {
    const app = {
      plugins: {
        manifests: { dataview: {} },
        enabledPlugins: new Set(),
        plugins: {},
      },
    };
    const result = checkDataviewPlugin(app);
    expect(result.isInstalled).toBe(true);
    expect(result.isEnabled).toBe(false);
    expect(result.isReady).toBe(false);
    expect(result.getMessage()).not.toBeNull();
  });

  it("detects when plugin is installed and enabled but not loaded", () => {
    const app = {
      plugins: {
        manifests: { dataview: {} },
        enabledPlugins: new Set(["dataview"]),
        plugins: {},
      },
    };
    const result = checkDataviewPlugin(app);
    expect(result.isInstalled).toBe(true);
    expect(result.isEnabled).toBe(true);
    expect(result.isLoaded).toBe(false);
    expect(result.isReady).toBe(false);
    expect(result.getMessage()).not.toBeNull();
  });

  it("detects when plugin is fully ready", () => {
    const app = {
      plugins: {
        manifests: { dataview: {} },
        enabledPlugins: new Set(["dataview"]),
        plugins: { dataview: { api: {} } },
      },
    };
    const result = checkDataviewPlugin(app);
    expect(result.isInstalled).toBe(true);
    expect(result.isEnabled).toBe(true);
    expect(result.isLoaded).toBe(true);
    expect(result.isReady).toBe(true);
    expect(result.getMessage()).toBeNull();
  });
});
