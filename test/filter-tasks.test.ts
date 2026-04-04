import { getFilteredNodeIds, NO_TAGS_VALUE } from "../src/lib/filter-tasks";
import { NoteTask } from "../src/types/note-task";
import { TaskStatus } from "../src/types/task";
import { FilterState, DEFAULT_FILTER_STATE } from "../src/types/filter-state";

function makeTask(overrides: {
  id: string;
  summary?: string;
  tags?: string[];
  status?: TaskStatus;
  link?: string;
  incomingLinks?: string[];
  starred?: boolean;
}): NoteTask {
  return new NoteTask({
    id: overrides.id,
    summary: overrides.summary ?? overrides.id,
    text: "",
    tags: overrides.tags ?? [],
    status: overrides.status ?? "todo",
    priority: "",
    link: overrides.link ?? `tasks/${overrides.id}.md`,
    incomingLinks: overrides.incomingLinks ?? [],
    starred: overrides.starred ?? false,
  });
}

function filter(overrides: Partial<FilterState> = {}): FilterState {
  return { ...DEFAULT_FILTER_STATE, ...overrides };
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
      const result = getFilteredNodeIds(tasks, filter());
      expect(result).toEqual(["T1", "T2", "T3", "T4", "T5"]);
    });
  });

  describe("tag filtering", () => {
    it("filters by a single selected tag", () => {
      const result = getFilteredNodeIds(
        tasks,
        filter({ selectedTags: ["auth"] })
      );
      expect(result).toEqual(["T1", "T5"]);
    });

    it("filters by multiple selected tags (OR logic)", () => {
      const result = getFilteredNodeIds(
        tasks,
        filter({ selectedTags: ["frontend", "testing"] })
      );
      expect(result).toEqual(["T1", "T3"]);
    });

    it("filters by NO_TAGS_VALUE to find untagged tasks", () => {
      const result = getFilteredNodeIds(
        tasks,
        filter({ selectedTags: [NO_TAGS_VALUE] })
      );
      expect(result).toEqual(["T4"]);
    });

    it("combines NO_TAGS_VALUE with regular tags", () => {
      const result = getFilteredNodeIds(
        tasks,
        filter({ selectedTags: [NO_TAGS_VALUE, "testing"] })
      );
      expect(result).toEqual(["T3", "T4"]);
    });
  });

  describe("excluded tags", () => {
    it("excludes tasks with a specific tag", () => {
      const result = getFilteredNodeIds(
        tasks,
        filter({ excludedTags: ["auth"] })
      );
      expect(result).toEqual(["T2", "T3", "T4"]);
    });

    it("excludes tasks matching any excluded tag", () => {
      const result = getFilteredNodeIds(
        tasks,
        filter({ excludedTags: ["auth", "testing"] })
      );
      expect(result).toEqual(["T2", "T4"]);
    });
  });

  describe("status filtering", () => {
    it("filters by a single status", () => {
      const result = getFilteredNodeIds(
        tasks,
        filter({ selectedStatuses: ["done"] })
      );
      expect(result).toEqual(["T3"]);
    });

    it("filters by multiple statuses", () => {
      const result = getFilteredNodeIds(
        tasks,
        filter({ selectedStatuses: ["todo", "in_progress"] })
      );
      expect(result).toEqual(["T1", "T2", "T5"]);
    });
  });

  describe("file/folder filtering", () => {
    it("filters by exact file path", () => {
      const result = getFilteredNodeIds(
        tasks,
        filter({ selectedFiles: ["ops/T4.md"] })
      );
      expect(result).toEqual(["T4"]);
    });

    it("filters by folder (trailing slash)", () => {
      const result = getFilteredNodeIds(
        tasks,
        filter({ selectedFiles: ["src/tasks/"] })
      );
      expect(result).toEqual(["T1", "T2", "T5"]);
    });

    it("matches multiple file paths", () => {
      const result = getFilteredNodeIds(
        tasks,
        filter({ selectedFiles: ["ops/T4.md", "tests/T3.md"] })
      );
      expect(result).toEqual(["T3", "T4"]);
    });
  });

  describe("search query", () => {
    it("matches by summary (case-insensitive)", () => {
      const result = getFilteredNodeIds(
        tasks,
        filter({ searchQuery: "login" })
      );
      expect(result).toEqual(["T1"]);
    });

    it("matches by task ID", () => {
      const result = getFilteredNodeIds(tasks, filter({ searchQuery: "T3" }));
      expect(result).toEqual(["T3"]);
    });

    it("matches by tag text", () => {
      const result = getFilteredNodeIds(
        tasks,
        filter({ searchQuery: "backend" })
      );
      expect(result).toEqual(["T2", "T5"]);
    });

    it("is case-insensitive", () => {
      const result = getFilteredNodeIds(
        tasks,
        filter({ searchQuery: "BUILD" })
      );
      expect(result).toEqual(["T1"]);
    });

    it("matches partial strings", () => {
      const result = getFilteredNodeIds(tasks, filter({ searchQuery: "auth" }));
      expect(result).toEqual(["T1", "T5"]);
    });

    it("ignores whitespace-only queries", () => {
      const result = getFilteredNodeIds(tasks, filter({ searchQuery: "   " }));
      expect(result).toEqual(["T1", "T2", "T3", "T4", "T5"]);
    });
  });

  describe("combined filters", () => {
    it("applies tag filter + search together", () => {
      const result = getFilteredNodeIds(
        tasks,
        filter({ selectedTags: ["auth"], searchQuery: "login" })
      );
      expect(result).toEqual(["T1"]);
    });

    it("applies status + search together", () => {
      const result = getFilteredNodeIds(
        tasks,
        filter({ selectedStatuses: ["todo"], searchQuery: "auth" })
      );
      expect(result).toEqual(["T1", "T5"]);
    });

    it("applies excluded tags + search together", () => {
      const result = getFilteredNodeIds(
        tasks,
        filter({ excludedTags: ["frontend"], searchQuery: "auth" })
      );
      expect(result).toEqual(["T5"]);
    });

    it("applies file filter + search together", () => {
      const result = getFilteredNodeIds(
        tasks,
        filter({ selectedFiles: ["src/tasks/"], searchQuery: "database" })
      );
      expect(result).toEqual(["T2"]);
    });

    it("returns empty when filters eliminate all tasks", () => {
      const result = getFilteredNodeIds(
        tasks,
        filter({ selectedTags: ["frontend"], selectedStatuses: ["done"] })
      );
      expect(result).toEqual([]);
    });
  });

  describe("starred filtering", () => {
    const starredTasks = [
      makeTask({ id: "T1", summary: "Starred task A", starred: true }),
      makeTask({ id: "T2", summary: "Unstarred task B", starred: false }),
      makeTask({ id: "T3", summary: "Starred task C", starred: true }),
      makeTask({ id: "T4", summary: "Unstarred task D", starred: false }),
    ];

    it("returns all tasks when onlyStarred is false", () => {
      const result = getFilteredNodeIds(
        starredTasks,
        filter({ onlyStarred: false })
      );
      expect(result).toEqual(["T1", "T2", "T3", "T4"]);
    });

    it("returns only starred tasks when onlyStarred is true", () => {
      const result = getFilteredNodeIds(
        starredTasks,
        filter({ onlyStarred: true })
      );
      expect(result).toEqual(["T1", "T3"]);
    });

    it("returns empty when onlyStarred is true and no tasks are starred", () => {
      const unstarredTasks = [
        makeTask({ id: "T1", starred: false }),
        makeTask({ id: "T2", starred: false }),
      ];
      const result = getFilteredNodeIds(
        unstarredTasks,
        filter({ onlyStarred: true })
      );
      expect(result).toEqual([]);
    });

    it("combines onlyStarred with status filter", () => {
      const mixed = [
        makeTask({ id: "T1", starred: true, status: "todo" }),
        makeTask({ id: "T2", starred: true, status: "done" }),
        makeTask({ id: "T3", starred: false, status: "todo" }),
      ];
      const result = getFilteredNodeIds(
        mixed,
        filter({ onlyStarred: true, selectedStatuses: ["done"] })
      );
      expect(result).toEqual(["T2"]);
    });

    it("combines onlyStarred with search query", () => {
      const mixed = [
        makeTask({ id: "T1", summary: "Deploy app", starred: true }),
        makeTask({ id: "T2", summary: "Deploy app", starred: false }),
        makeTask({ id: "T3", summary: "Write tests", starred: true }),
      ];
      const result = getFilteredNodeIds(
        mixed,
        filter({ onlyStarred: true, searchQuery: "deploy" })
      );
      expect(result).toEqual(["T1"]);
    });
  });

  describe("search with traversal modes", () => {
    // Graph: T1 -> T2 -> T3 (T2 depends on T1, T3 depends on T2)
    const linkedTasks = [
      makeTask({
        id: "T1",
        summary: "Root task",
        tags: ["root"],
        status: "todo",
        link: "tasks/T1.md",
        incomingLinks: [],
      }),
      makeTask({
        id: "T2",
        summary: "Middle task",
        tags: ["middle"],
        status: "in_progress",
        link: "tasks/T2.md",
        incomingLinks: ["T1"],
      }),
      makeTask({
        id: "T3",
        summary: "Leaf task",
        tags: ["leaf"],
        status: "done",
        link: "tasks/T3.md",
        incomingLinks: ["T2"],
      }),
    ];

    it("match mode returns only search-matched nodes", () => {
      const result = getFilteredNodeIds(
        linkedTasks,
        filter({ searchQuery: "Middle", traversalMode: "match" })
      );
      expect(result).toEqual(["T2"]);
    });

    it("upstream mode includes transitive dependencies", () => {
      const result = getFilteredNodeIds(
        linkedTasks,
        filter({ searchQuery: "Leaf", traversalMode: "upstream" })
      );
      expect(result).toEqual(["T1", "T2", "T3"]);
    });

    it("downstream mode includes transitive dependents", () => {
      const result = getFilteredNodeIds(
        linkedTasks,
        filter({ searchQuery: "Root", traversalMode: "downstream" })
      );
      expect(result).toEqual(["T1", "T2", "T3"]);
    });

    it("both mode includes upstream and downstream", () => {
      const result = getFilteredNodeIds(
        linkedTasks,
        filter({ searchQuery: "Middle", traversalMode: "both" })
      );
      expect(result).toEqual(["T1", "T2", "T3"]);
    });

    it("traversal respects non-search filters", () => {
      const result = getFilteredNodeIds(
        linkedTasks,
        filter({
          searchQuery: "Leaf",
          traversalMode: "upstream",
          selectedStatuses: ["done", "in_progress"],
        })
      );
      // T1 is "todo" so filtered out; traversal can't reach through it
      expect(result).toEqual(["T2", "T3"]);
    });
  });
});
