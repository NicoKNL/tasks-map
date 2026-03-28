import { getFilteredNodeIds, NO_TAGS_VALUE } from "../src/lib/filter-tasks";
import { NoteTask } from "../src/types/note-task";
import { TaskStatus } from "../src/types/task";

function makeTask(overrides: {
  id: string;
  summary?: string;
  tags?: string[];
  status?: TaskStatus;
  link?: string;
}): NoteTask {
  return new NoteTask({
    id: overrides.id,
    summary: overrides.summary ?? overrides.id,
    text: "",
    tags: overrides.tags ?? [],
    status: overrides.status ?? "todo",
    priority: "",
    link: overrides.link ?? `tasks/${overrides.id}.md`,
    incomingLinks: [],
    starred: false,
  });
}

describe("getFilteredNodeIds", () => {
  const tasks = [
    makeTask({
      id: "T1",
      summary: "Build login page",
      tags: ["frontend", "auth"],
      status: "todo",
      link: "src/tasks/T1.md",
    }),
    makeTask({
      id: "T2",
      summary: "Setup database",
      tags: ["backend"],
      status: "in_progress",
      link: "src/tasks/T2.md",
    }),
    makeTask({
      id: "T3",
      summary: "Write tests",
      tags: ["testing"],
      status: "done",
      link: "tests/T3.md",
    }),
    makeTask({
      id: "T4",
      summary: "Deploy to prod",
      tags: [],
      status: "canceled",
      link: "ops/T4.md",
    }),
    makeTask({
      id: "T5",
      summary: "Auth middleware",
      tags: ["backend", "auth"],
      status: "todo",
      link: "src/tasks/T5.md",
    }),
  ];

  describe("no filters", () => {
    it("returns all task IDs when no filters are applied", () => {
      const result = getFilteredNodeIds(tasks, [], [], [], [], "");
      expect(result).toEqual(["T1", "T2", "T3", "T4", "T5"]);
    });
  });

  describe("tag filtering", () => {
    it("filters by a single selected tag", () => {
      const result = getFilteredNodeIds(tasks, ["auth"], [], [], [], "");
      expect(result).toEqual(["T1", "T5"]);
    });

    it("filters by multiple selected tags (OR logic)", () => {
      const result = getFilteredNodeIds(
        tasks,
        ["frontend", "testing"],
        [],
        [],
        [],
        ""
      );
      expect(result).toEqual(["T1", "T3"]);
    });

    it("filters by NO_TAGS_VALUE to find untagged tasks", () => {
      const result = getFilteredNodeIds(tasks, [NO_TAGS_VALUE], [], [], [], "");
      expect(result).toEqual(["T4"]);
    });

    it("combines NO_TAGS_VALUE with regular tags", () => {
      const result = getFilteredNodeIds(
        tasks,
        [NO_TAGS_VALUE, "testing"],
        [],
        [],
        [],
        ""
      );
      expect(result).toEqual(["T3", "T4"]);
    });
  });

  describe("excluded tags", () => {
    it("excludes tasks with a specific tag", () => {
      const result = getFilteredNodeIds(tasks, [], [], ["auth"], [], "");
      expect(result).toEqual(["T2", "T3", "T4"]);
    });

    it("excludes tasks matching any excluded tag", () => {
      const result = getFilteredNodeIds(
        tasks,
        [],
        [],
        ["auth", "testing"],
        [],
        ""
      );
      expect(result).toEqual(["T2", "T4"]);
    });
  });

  describe("status filtering", () => {
    it("filters by a single status", () => {
      const result = getFilteredNodeIds(tasks, [], ["done"], [], [], "");
      expect(result).toEqual(["T3"]);
    });

    it("filters by multiple statuses", () => {
      const result = getFilteredNodeIds(
        tasks,
        [],
        ["todo", "in_progress"],
        [],
        [],
        ""
      );
      expect(result).toEqual(["T1", "T2", "T5"]);
    });
  });

  describe("file/folder filtering", () => {
    it("filters by exact file path", () => {
      const result = getFilteredNodeIds(tasks, [], [], [], ["ops/T4.md"], "");
      expect(result).toEqual(["T4"]);
    });

    it("filters by folder (trailing slash)", () => {
      const result = getFilteredNodeIds(tasks, [], [], [], ["src/tasks/"], "");
      expect(result).toEqual(["T1", "T2", "T5"]);
    });

    it("matches multiple file paths", () => {
      const result = getFilteredNodeIds(
        tasks,
        [],
        [],
        [],
        ["ops/T4.md", "tests/T3.md"],
        ""
      );
      expect(result).toEqual(["T3", "T4"]);
    });
  });

  describe("search query", () => {
    it("matches by summary (case-insensitive)", () => {
      const result = getFilteredNodeIds(tasks, [], [], [], [], "login");
      expect(result).toEqual(["T1"]);
    });

    it("matches by task ID", () => {
      const result = getFilteredNodeIds(tasks, [], [], [], [], "T3");
      expect(result).toEqual(["T3"]);
    });

    it("matches by tag text", () => {
      const result = getFilteredNodeIds(tasks, [], [], [], [], "backend");
      expect(result).toEqual(["T2", "T5"]);
    });

    it("is case-insensitive", () => {
      const result = getFilteredNodeIds(tasks, [], [], [], [], "BUILD");
      expect(result).toEqual(["T1"]);
    });

    it("matches partial strings", () => {
      const result = getFilteredNodeIds(tasks, [], [], [], [], "auth");
      expect(result).toEqual(["T1", "T5"]);
    });

    it("ignores whitespace-only queries", () => {
      const result = getFilteredNodeIds(tasks, [], [], [], [], "   ");
      expect(result).toEqual(["T1", "T2", "T3", "T4", "T5"]);
    });
  });

  describe("combined filters", () => {
    it("applies tag filter + search together", () => {
      const result = getFilteredNodeIds(tasks, ["auth"], [], [], [], "login");
      expect(result).toEqual(["T1"]);
    });

    it("applies status + search together", () => {
      const result = getFilteredNodeIds(tasks, [], ["todo"], [], [], "auth");
      expect(result).toEqual(["T1", "T5"]);
    });

    it("applies excluded tags + search together", () => {
      const result = getFilteredNodeIds(
        tasks,
        [],
        [],
        ["frontend"],
        [],
        "auth"
      );
      expect(result).toEqual(["T5"]);
    });

    it("applies file filter + search together", () => {
      const result = getFilteredNodeIds(
        tasks,
        [],
        [],
        [],
        ["src/tasks/"],
        "database"
      );
      expect(result).toEqual(["T2"]);
    });

    it("returns empty when filters eliminate all tasks", () => {
      const result = getFilteredNodeIds(
        tasks,
        ["frontend"],
        ["done"],
        [],
        [],
        ""
      );
      expect(result).toEqual([]);
    });
  });
});
