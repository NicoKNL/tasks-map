import { TaskFactory } from "../src/lib/task-factory";
import { DataviewTask } from "../src/types/dataview-task";
import { NoteTask } from "../src/types/note-task";
import { RawTask } from "../src/types/task";

describe("TaskFactory", () => {
  let factory: TaskFactory;

  beforeEach(() => {
    factory = new TaskFactory();
  });

  describe("parse", () => {
    it("creates a DataviewTask by default", () => {
      const raw: RawTask = {
        status: " ",
        text: "Some task 🆔 abc123",
        link: { path: "tasks/foo.md" },
      };
      const task = factory.parse(raw);
      expect(task).toBeInstanceOf(DataviewTask);
      expect(task.type).toBe("dataview");
    });

    it("creates a NoteTask when type is 'note'", () => {
      const raw: RawTask = {
        status: "open",
        text: "Note task",
        link: { path: "notes/bar.md" },
      };
      const task = factory.parse(raw, "note");
      expect(task).toBeInstanceOf(NoteTask);
      expect(task.type).toBe("note");
    });

    it("sets the link from rawTask.link.path", () => {
      const raw: RawTask = {
        status: " ",
        text: "test",
        link: { path: "tasks/baz.md" },
      };
      expect(factory.parse(raw).link).toBe("tasks/baz.md");
    });
  });

  describe("ID parsing", () => {
    it("extracts emoji-format ID", () => {
      const raw: RawTask = {
        status: " ",
        text: "Do the thing 🆔 abc123",
        link: { path: "t.md" },
      };
      expect(factory.parse(raw).id).toBe("abc123");
    });

    it("extracts dataview bracket-format ID", () => {
      const raw: RawTask = {
        status: " ",
        text: "Do the thing [id:: xyz789]",
        link: { path: "t.md" },
      };
      expect(factory.parse(raw).id).toBe("xyz789");
    });

    it("extracts dataview parentheses-format ID", () => {
      const raw: RawTask = {
        status: " ",
        text: "Do the thing (id:: pqr456)",
        link: { path: "t.md" },
      };
      expect(factory.parse(raw).id).toBe("pqr456");
    });

    it("generates a random 6-char ID when no ID is present", () => {
      const raw: RawTask = {
        status: " ",
        text: "No id here",
        link: { path: "t.md" },
      };
      const task = factory.parse(raw);
      expect(task.id).toHaveLength(6);
      expect(task.id).toMatch(/^[a-z0-9]+$/);
    });
  });

  describe("status parsing", () => {
    it.each([
      ["x", "done"],
      ["/", "in_progress"],
      ["-", "canceled"],
      [" ", "todo"],
      ["?", "todo"],
      // Note-based statuses
      ["done", "done"],
      ["in-progress", "in_progress"],
      ["open", "todo"],
      ["none", "todo"],
    ])("maps status '%s' to '%s'", (input, expected) => {
      const raw: RawTask = {
        status: input,
        text: "task 🆔 aaaaaa",
        link: { path: "t.md" },
      };
      expect(factory.parse(raw).status).toBe(expected);
    });
  });

  describe("tag parsing", () => {
    it("extracts hashtags from text", () => {
      const raw: RawTask = {
        status: " ",
        text: "Fix bug #frontend #urgent 🆔 aaaaaa",
        link: { path: "t.md" },
      };
      expect(factory.parse(raw).tags).toEqual(["frontend", "urgent"]);
    });

    it("returns empty array when no tags", () => {
      const raw: RawTask = {
        status: " ",
        text: "No tags here 🆔 aaaaaa",
        link: { path: "t.md" },
      };
      expect(factory.parse(raw).tags).toEqual([]);
    });
  });

  describe("priority parsing", () => {
    it("extracts high priority emoji", () => {
      const raw: RawTask = {
        status: " ",
        text: "Important ⏫ 🆔 aaaaaa",
        link: { path: "t.md" },
      };
      expect(factory.parse(raw).priority).toBe("⏫");
    });

    it("extracts low priority emoji", () => {
      const raw: RawTask = {
        status: " ",
        text: "Maybe later 🔽 🆔 aaaaaa",
        link: { path: "t.md" },
      };
      expect(factory.parse(raw).priority).toBe("🔽");
    });

    it("returns empty string when no priority", () => {
      const raw: RawTask = {
        status: " ",
        text: "Regular task 🆔 aaaaaa",
        link: { path: "t.md" },
      };
      expect(factory.parse(raw).priority).toBe("");
    });
  });

  describe("starred parsing", () => {
    it("detects star emoji", () => {
      const raw: RawTask = {
        status: " ",
        text: "Important ⭐ 🆔 aaaaaa",
        link: { path: "t.md" },
      };
      expect(factory.parse(raw).starred).toBe(true);
    });

    it("returns false when no star", () => {
      const raw: RawTask = {
        status: " ",
        text: "Normal task 🆔 aaaaaa",
        link: { path: "t.md" },
      };
      expect(factory.parse(raw).starred).toBe(false);
    });
  });

  describe("incoming links parsing", () => {
    it("parses individual-style links", () => {
      const raw: RawTask = {
        status: " ",
        text: "Blocked ⛔ abc123 🆔 zzzzzz",
        link: { path: "t.md" },
      };
      expect(factory.parse(raw).incomingLinks).toContain("abc123");
    });

    it("parses CSV-style links", () => {
      const raw: RawTask = {
        status: " ",
        text: "Blocked ⛔ abc123,def456 🆔 zzzzzz",
        link: { path: "t.md" },
      };
      const links = factory.parse(raw).incomingLinks;
      expect(links).toContain("abc123");
      expect(links).toContain("def456");
    });

    it("parses dataview bracket-style depends", () => {
      const raw: RawTask = {
        status: " ",
        text: "Blocked [dependsOn:: abc123, def456] 🆔 zzzzzz",
        link: { path: "t.md" },
      };
      const links = factory.parse(raw).incomingLinks;
      expect(links).toContain("abc123");
      expect(links).toContain("def456");
    });

    it("parses dataview parentheses-style depends", () => {
      const raw: RawTask = {
        status: " ",
        text: "Blocked (dependsOn:: abc123) 🆔 zzzzzz",
        link: { path: "t.md" },
      };
      expect(factory.parse(raw).incomingLinks).toContain("abc123");
    });

    it("returns empty array when no incoming links", () => {
      const raw: RawTask = {
        status: " ",
        text: "Independent task 🆔 aaaaaa",
        link: { path: "t.md" },
      };
      expect(factory.parse(raw).incomingLinks).toEqual([]);
    });

    it("deduplicates links from multiple formats", () => {
      const raw: RawTask = {
        status: " ",
        text: "Blocked ⛔ abc123 [dependsOn:: abc123] 🆔 zzzzzz",
        link: { path: "t.md" },
      };
      const links = factory.parse(raw).incomingLinks;
      const unique = new Set(links);
      expect(unique.size).toBe(links.length);
    });
  });

  describe("summary generation", () => {
    it("strips IDs, tags, emojis from summary", () => {
      const raw: RawTask = {
        status: " ",
        text: "Build the login page #frontend 🆔 abc123 ⏫",
        link: { path: "t.md" },
      };
      const summary = factory.parse(raw).summary;
      expect(summary).not.toContain("#frontend");
      expect(summary).not.toContain("🆔");
      expect(summary).not.toContain("abc123");
      expect(summary).toContain("Build the login page");
    });

    it("strips star emoji from summary", () => {
      const raw: RawTask = {
        status: " ",
        text: "Starred task ⭐ 🆔 abc123",
        link: { path: "t.md" },
      };
      const summary = factory.parse(raw).summary;
      expect(summary).not.toContain("⭐");
    });

    it("strips dataview bracket IDs", () => {
      const raw: RawTask = {
        status: " ",
        text: "Build feature [id:: abc123]",
        link: { path: "t.md" },
      };
      expect(factory.parse(raw).summary).not.toContain("[id::");
    });

    it("strips dependency links", () => {
      const raw: RawTask = {
        status: " ",
        text: "Blocked task ⛔ abc123 🆔 zzzzzz",
        link: { path: "t.md" },
      };
      expect(factory.parse(raw).summary).not.toContain("⛔");
    });
  });

  describe("text cleaning", () => {
    it("takes only the first line", () => {
      const raw: RawTask = {
        status: " ",
        text: "First line\nSecond line\nThird line",
        link: { path: "t.md" },
      };
      expect(factory.parse(raw).text).toBe("First line");
    });

    it("trims whitespace", () => {
      const raw: RawTask = {
        status: " ",
        text: "  padded text  ",
        link: { path: "t.md" },
      };
      expect(factory.parse(raw).text).toBe("padded text");
    });
  });

  describe("isEmptyTask", () => {
    it("returns true for a task with only metadata", () => {
      const raw: RawTask = {
        status: " ",
        text: "#tag 🆔 abc123 ⛔ def456",
        link: { path: "t.md" },
      };
      const task = factory.parse(raw);
      expect(factory.isEmptyTask(task)).toBe(true);
    });

    it("returns false for a task with meaningful content", () => {
      const raw: RawTask = {
        status: " ",
        text: "Build login page #frontend 🆔 abc123",
        link: { path: "t.md" },
      };
      const task = factory.parse(raw);
      expect(factory.isEmptyTask(task)).toBe(false);
    });

    it("returns true for whitespace-only summary", () => {
      const raw: RawTask = {
        status: " ",
        text: "   ",
        link: { path: "t.md" },
      };
      const task = factory.parse(raw);
      expect(factory.isEmptyTask(task)).toBe(true);
    });
  });
});
