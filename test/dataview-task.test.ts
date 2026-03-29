import { Vault, App } from "./mocks/obsidian";
import { DataviewTask } from "../src/types/dataview-task";

function makeDataviewTask(
  overrides: Partial<ConstructorParameters<typeof DataviewTask>[0]> = {}
): DataviewTask {
  return new DataviewTask({
    id: "abc123",
    summary: "Test task",
    text: "Test task 🆔 abc123",
    tags: [],
    status: "todo",
    priority: "",
    link: "tasks/test.md",
    incomingLinks: [],
    starred: false,
    ...overrides,
  });
}

describe("DataviewTask", () => {
  let vault: Vault;
  let app: App;

  beforeEach(() => {
    app = new App();
    vault = app.vault;
  });

  describe("updateStatus", () => {
    it("changes checkbox from todo to done", async () => {
      const content = "- [ ] Test task 🆔 abc123";
      vault.setFileContent("tasks/test.md", content);

      const task = makeDataviewTask();
      await task.updateStatus("done", app);

      const updated = vault.getFileContent("tasks/test.md");
      expect(updated).toContain("[x]");
      expect(updated).not.toContain("[ ]");
    });

    it("adds done timestamp when marking done", async () => {
      const content = "- [ ] Test task 🆔 abc123";
      vault.setFileContent("tasks/test.md", content);

      const task = makeDataviewTask();
      await task.updateStatus("done", app);

      const updated = vault.getFileContent("tasks/test.md");
      expect(updated).toContain("✅");
    });

    it("changes to in_progress and adds start date", async () => {
      const content = "- [ ] Test task 🆔 abc123";
      vault.setFileContent("tasks/test.md", content);

      const task = makeDataviewTask();
      await task.updateStatus("in_progress", app);

      const updated = vault.getFileContent("tasks/test.md");
      expect(updated).toContain("[/]");
      expect(updated).toContain("🛫");
    });

    it("changes to todo and removes done/canceled/start dates", async () => {
      const content = "- [x] Test task 🆔 abc123 ✅ 2025-01-01 🛫 2025-01-01";
      vault.setFileContent("tasks/test.md", content);

      const task = makeDataviewTask();
      await task.updateStatus("todo", app);

      const updated = vault.getFileContent("tasks/test.md");
      expect(updated).toContain("[ ]");
      expect(updated).not.toContain("✅");
      expect(updated).not.toContain("🛫");
    });

    it("does nothing when link is missing", async () => {
      const task = makeDataviewTask({ link: "" });
      await task.updateStatus("done", app);
      // Should not throw
    });

    it("does nothing when text is missing", async () => {
      const task = makeDataviewTask({ text: "" });
      await task.updateStatus("done", app);
      // Should not throw
    });
  });

  describe("addTaskLine", () => {
    it("inserts a new task line after the current task", async () => {
      const content = "- [ ] Test task 🆔 abc123\n- [ ] Other task";
      vault.setFileContent("tasks/test.md", content);

      const task = makeDataviewTask();
      await task.addTaskLine("- [ ] New subtask", app);

      const updated = vault.getFileContent("tasks/test.md");
      const lines = updated.split("\n");
      expect(lines[1]).toBe("- [ ] New subtask");
    });

    it("does nothing when link is missing", async () => {
      const task = makeDataviewTask({ link: "" });
      await task.addTaskLine("- [ ] new", app);
      // Should not throw
    });
  });

  describe("delete", () => {
    it("removes the task line from the file", async () => {
      const content = "- [ ] Test task 🆔 abc123\n- [ ] Other task";
      vault.setFileContent("tasks/test.md", content);

      const task = makeDataviewTask();
      await task.delete(app);

      const updated = vault.getFileContent("tasks/test.md");
      expect(updated).not.toContain("Test task");
      expect(updated).toContain("Other task");
    });

    it("does nothing when link is missing", async () => {
      const task = makeDataviewTask({ link: "" });
      await task.delete(app);
    });
  });

  describe("addStar", () => {
    it("adds star emoji to task line", async () => {
      const content = "- [ ] Test task 🆔 abc123";
      vault.setFileContent("tasks/test.md", content);

      const task = makeDataviewTask();
      await task.addStar(app);

      const updated = vault.getFileContent("tasks/test.md");
      expect(updated).toContain("⭐");
    });

    it("does not add duplicate star", async () => {
      const content = "- [ ] Test task 🆔 abc123 ⭐";
      vault.setFileContent("tasks/test.md", content);

      const task = makeDataviewTask();
      await task.addStar(app);

      const updated = vault.getFileContent("tasks/test.md");
      const starCount = (updated.match(/⭐/g) || []).length;
      expect(starCount).toBe(1);
    });
  });

  describe("removeStar", () => {
    it("removes star emoji from task line", async () => {
      const content = "- [ ] Test task 🆔 abc123 ⭐";
      vault.setFileContent("tasks/test.md", content);

      const task = makeDataviewTask();
      await task.removeStar(app);

      const updated = vault.getFileContent("tasks/test.md");
      expect(updated).not.toContain("⭐");
    });
  });

  describe("addTag", () => {
    it("adds a tag to the task line", async () => {
      const content = "- [ ] Test task 🆔 abc123";
      vault.setFileContent("tasks/test.md", content);

      const task = makeDataviewTask();
      await task.addTag("urgent", app);

      const updated = vault.getFileContent("tasks/test.md");
      expect(updated).toContain("#urgent");
    });

    it("does not add duplicate tag", async () => {
      const content = "- [ ] Test task #urgent 🆔 abc123";
      vault.setFileContent("tasks/test.md", content);

      const task = makeDataviewTask({
        text: "Test task #urgent 🆔 abc123",
      });
      await task.addTag("urgent", app);

      const updated = vault.getFileContent("tasks/test.md");
      const tagCount = (updated.match(/#urgent/g) || []).length;
      expect(tagCount).toBe(1);
    });
  });

  describe("removeTag", () => {
    it("removes a tag from the task line", async () => {
      const content = "- [ ] Test task #urgent 🆔 abc123";
      vault.setFileContent("tasks/test.md", content);

      const task = makeDataviewTask({
        text: "Test task #urgent 🆔 abc123",
      });
      await task.removeTag("urgent", app);

      const updated = vault.getFileContent("tasks/test.md");
      expect(updated).not.toContain("#urgent");
    });
  });
});
