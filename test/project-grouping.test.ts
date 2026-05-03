import { NoteTask } from "../src/types/note-task";
import {
  partitionTasksByProject,
  createProjectGroupNodes,
  createNodesFromTasks,
  createEdgesFromTasks,
} from "../src/lib/utils";

function makeNoteTask(
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
    projects: [],
    ...overrides,
  });
}

describe("partitionTasksByProject", () => {
  it("puts tasks with no projects in noProjectTasks", () => {
    const task = makeNoteTask({ id: "t1", projects: [] });
    const { noProjectTasks, singleProjectMap, multiProjectTasks } =
      partitionTasksByProject([task]);
    expect(noProjectTasks).toContain(task);
    expect(singleProjectMap.size).toBe(0);
    expect(multiProjectTasks).toHaveLength(0);
  });

  it("puts a task with exactly one project in singleProjectMap", () => {
    const task = makeNoteTask({ id: "t1", projects: ["Alpha"] });
    const { singleProjectMap, noProjectTasks, multiProjectTasks } =
      partitionTasksByProject([task]);
    expect(singleProjectMap.get("Alpha")).toContain(task);
    expect(noProjectTasks).toHaveLength(0);
    expect(multiProjectTasks).toHaveLength(0);
  });

  it("puts a task with multiple projects in multiProjectTasks", () => {
    const task = makeNoteTask({ id: "t1", projects: ["Alpha", "Beta"] });
    const { multiProjectTasks, singleProjectMap, noProjectTasks } =
      partitionTasksByProject([task]);
    expect(multiProjectTasks).toContain(task);
    expect(singleProjectMap.size).toBe(0);
    expect(noProjectTasks).toHaveLength(0);
  });

  it("groups multiple tasks by the same project", () => {
    const t1 = makeNoteTask({ id: "t1", projects: ["Alpha"] });
    const t2 = makeNoteTask({ id: "t2", projects: ["Alpha"] });
    const t3 = makeNoteTask({ id: "t3", projects: ["Beta"] });
    const { singleProjectMap } = partitionTasksByProject([t1, t2, t3]);
    expect(singleProjectMap.get("Alpha")).toHaveLength(2);
    expect(singleProjectMap.get("Beta")).toHaveLength(1);
  });

  describe("edge cases", () => {
    it("handles an empty task list", () => {
      const result = partitionTasksByProject([]);
      expect(result.singleProjectMap.size).toBe(0);
      expect(result.multiProjectTasks).toHaveLength(0);
      expect(result.noProjectTasks).toHaveLength(0);
    });

    it("handles a mix of all three categories", () => {
      const none = makeNoteTask({ id: "none", projects: [] });
      const single = makeNoteTask({ id: "single", projects: ["A"] });
      const multi = makeNoteTask({ id: "multi", projects: ["A", "B"] });
      const { noProjectTasks, singleProjectMap, multiProjectTasks } =
        partitionTasksByProject([none, single, multi]);
      expect(noProjectTasks).toContain(none);
      expect(singleProjectMap.get("A")).toContain(single);
      expect(multiProjectTasks).toContain(multi);
    });
  });
});

describe("createProjectGroupNodes", () => {
  it("creates a group node for each single-project set", () => {
    const t1 = makeNoteTask({ id: "t1", projects: ["Alpha"] });
    const t2 = makeNoteTask({ id: "t2", projects: ["Beta"] });
    const tasks = [t1, t2];
    const taskNodes = createNodesFromTasks(tasks);
    const edges = createEdgesFromTasks(tasks);

    const result = createProjectGroupNodes(
      taskNodes,
      tasks,
      edges,
      "Horizontal",
      true
    );

    const groupNodes = result.filter((n) => n.type === "projectGroup");
    expect(groupNodes).toHaveLength(2);
    expect(groupNodes.map((n) => n.data.label).sort()).toEqual([
      "Alpha",
      "Beta",
    ]);
  });

  it("assigns parentNode to members of a single-project group", () => {
    const t1 = makeNoteTask({ id: "t1", projects: ["Alpha"] });
    const tasks = [t1];
    const taskNodes = createNodesFromTasks(tasks);
    const edges = createEdgesFromTasks(tasks);

    const result = createProjectGroupNodes(
      taskNodes,
      tasks,
      edges,
      "Horizontal",
      true
    );

    const childNode = result.find((n) => n.id === "t1");
    expect(childNode?.parentNode).toBe("project-group-Alpha");
    expect(childNode?.extent).toBe("parent");
  });

  it("does not assign parentNode to multi-project tasks", () => {
    const t1 = makeNoteTask({ id: "t1", projects: ["Alpha", "Beta"] });
    const tasks = [t1];
    const taskNodes = createNodesFromTasks(tasks);
    const edges = createEdgesFromTasks(tasks);

    const result = createProjectGroupNodes(
      taskNodes,
      tasks,
      edges,
      "Horizontal",
      true
    );

    const taskNode = result.find((n) => n.id === "t1");
    expect(taskNode?.parentNode).toBeUndefined();
  });

  it("does not assign parentNode to no-project tasks", () => {
    const t1 = makeNoteTask({ id: "t1", projects: [] });
    const tasks = [t1];
    const taskNodes = createNodesFromTasks(tasks);
    const edges = createEdgesFromTasks(tasks);

    const result = createProjectGroupNodes(
      taskNodes,
      tasks,
      edges,
      "Horizontal",
      true
    );

    const taskNode = result.find((n) => n.id === "t1");
    expect(taskNode?.parentNode).toBeUndefined();
  });

  it("group node has positive width and height", () => {
    const t1 = makeNoteTask({ id: "t1", projects: ["Alpha"] });
    const tasks = [t1];
    const taskNodes = createNodesFromTasks(tasks);
    const edges = createEdgesFromTasks(tasks);

    const result = createProjectGroupNodes(
      taskNodes,
      tasks,
      edges,
      "Horizontal",
      true
    );

    const groupNode = result.find((n) => n.type === "projectGroup");
    expect(Number(groupNode?.style?.width)).toBeGreaterThan(0);
    expect(Number(groupNode?.style?.height)).toBeGreaterThan(0);
  });
});

describe("BaseTask.projects default", () => {
  it("DataviewTask has projects defaulting to []", () => {
    const { TaskFactory } = require("../src/lib/task-factory");
    const factory = new TaskFactory();
    const task = factory.parse({
      status: " ",
      text: "Some task",
      link: { path: "t.md" },
    });
    expect(task.projects).toEqual([]);
  });
});
