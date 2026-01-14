import { Vault, App } from './mocks/obsidian';
import { Task } from '../src/types/task';
import { NoteTask } from '../src/types/note-task';
import {
  addTagToTaskInVault,
  removeTagFromTaskInVault,
  addStarToTaskInVault,
  removeStarFromTaskInVault,
} from '../src/lib/utils';

describe("Note-based Task Tag and Star Management", () => {
  let vault: Vault;
  let app: App;

  beforeEach(() => {
    app = new App();
    vault = app.vault;
  });

  describe("addTagToTaskInVault", () => {
    it("should add a tag to note without existing tags field", async () => {
      const taskPath = "TaskNotes/Tasks/Task1.md";
      const initialContent = `---
status: open
priority: Normal
---
# Task Content`;

      vault.setFileContent(taskPath, initialContent);

      const task: Task = new NoteTask({
id: taskPath,
        text: "Task1",
        summary: "Task1",
        link: taskPath,
        status: "todo",
        priority: "",
        tags: [],
        starred: false,
        incomingLinks: [],
      })

      await addTagToTaskInVault(task, "urgent", app);

      const updatedContent = vault.getFileContent(taskPath);

      expect(updatedContent).toContain("tags:");
      expect(updatedContent).toContain("  - urgent");

      // Verify indentation is correct
      const lines = updatedContent.split("\n");
      expect(lines.some((line: string) => line === "tags:")).toBe(true);
      expect(lines.some((line: string) => line === "  - urgent")).toBe(true);
    });

    it("should add a tag to existing tags list", async () => {
      const taskPath = "TaskNotes/Tasks/Task1.md";
      const initialContent = `---
status: open
tags:
  - work
  - project
---
# Task Content`;

      vault.setFileContent(taskPath, initialContent);

      const task: Task = new NoteTask({
id: taskPath,
        text: "Task1",
        summary: "Task1",
        link: taskPath,
        status: "todo",
        priority: "",
        tags: ["work", "project"],
        starred: false,
        incomingLinks: [],
      })

      await addTagToTaskInVault(task, "urgent", app);

      const updatedContent = vault.getFileContent(taskPath);

      expect(updatedContent).toContain("  - work");
      expect(updatedContent).toContain("  - project");
      expect(updatedContent).toContain("  - urgent");

      // Verify all tags have same indentation
      const lines = updatedContent.split("\n");
      const tagLines = lines.filter((line: string) => line.match(/^  - /));
      expect(tagLines.length).toBe(3);
      tagLines.forEach((line: string) => {
        expect(line).toMatch(/^  - /);
      });
    });

    it("should not add duplicate tag", async () => {
      const taskPath = "TaskNotes/Tasks/Task1.md";
      const initialContent = `---
tags:
  - urgent
  - work
---
# Task Content`;

      vault.setFileContent(taskPath, initialContent);

      const task: Task = new NoteTask({
id: taskPath,
        text: "Task1",
        summary: "Task1",
        link: taskPath,
        status: "todo",
        priority: "",
        tags: ["urgent", "work"],
        starred: false,
        incomingLinks: [],
      })

      await addTagToTaskInVault(task, "urgent", app);

      const updatedContent = vault.getFileContent(taskPath);

      // Should still have exactly 2 tags
      const lines = updatedContent.split("\n");
      const tagLines = lines.filter((line: string) => line.match(/^  - /));
      expect(tagLines.length).toBe(2);
    });

    it("should preserve frontmatter structure when adding tags", async () => {
      const taskPath = "TaskNotes/Tasks/Task1.md";
      const initialContent = `---
status: open
priority: High
starred: true
blockedBy:
  - uid: "[[Task2]]"
    reltype: FINISHTOSTART
---
# Task Content`;

      vault.setFileContent(taskPath, initialContent);

      const task: Task = new NoteTask({
id: taskPath,
        text: "Task1",
        summary: "Task1",
        link: taskPath,
        status: "todo",
        priority: "⏫",
        tags: [],
        starred: true,
        incomingLinks: [],
      })

      await addTagToTaskInVault(task, "urgent", app);

      const updatedContent = vault.getFileContent(taskPath);

      // Verify new tag was added
      expect(updatedContent).toContain("tags:");
      expect(updatedContent).toContain("  - urgent");

      // Verify other fields are intact
      expect(updatedContent).toContain("status: open");
      expect(updatedContent).toContain("priority: High");
      expect(updatedContent).toContain("starred: true");
      expect(updatedContent).toContain("blockedBy:");
      expect(updatedContent).toContain('  - uid: "[[Task2]]"');
    });
  });

  describe("removeTagFromTaskInVault", () => {
    it("should remove a tag from tags list", async () => {
      const taskPath = "TaskNotes/Tasks/Task1.md";
      const initialContent = `---
status: open
tags:
  - urgent
  - work
  - project
---
# Task Content`;

      vault.setFileContent(taskPath, initialContent);

      const task: Task = new NoteTask({
id: taskPath,
        text: "Task1",
        summary: "Task1",
        link: taskPath,
        status: "todo",
        priority: "",
        tags: ["urgent", "work", "project"],
        starred: false,
        incomingLinks: [],
      })

      await removeTagFromTaskInVault(task, "work", app);

      const updatedContent = vault.getFileContent(taskPath);

      expect(updatedContent).not.toContain("  - work");
      expect(updatedContent).toContain("  - urgent");
      expect(updatedContent).toContain("  - project");
    });

    it("should preserve indentation when removing tags", async () => {
      const taskPath = "TaskNotes/Tasks/Task1.md";
      const initialContent = `---
status: open
tags:
  - tag1
  - tag2
  - tag3
priority: Normal
---
# Task Content`;

      vault.setFileContent(taskPath, initialContent);

      const task: Task = new NoteTask({
id: taskPath,
        text: "Task1",
        summary: "Task1",
        link: taskPath,
        status: "todo",
        priority: "",
        tags: ["tag1", "tag2", "tag3"],
        starred: false,
        incomingLinks: [],
      })

      await removeTagFromTaskInVault(task, "tag2", app);

      const updatedContent = vault.getFileContent(taskPath);

      // Verify indentation is correct
      const lines = updatedContent.split("\n");
      lines.forEach((line: string) => {
        if (line.startsWith(" ")) {
          const leadingSpaces = line.match(/^ */)?.[0].length || 0;
          expect([0, 2, 4]).toContain(leadingSpaces);
        }
      });
    });
  });

  describe("addStarToTaskInVault", () => {
    it("should add starred field to note without it", async () => {
      const taskPath = "TaskNotes/Tasks/Task1.md";
      const initialContent = `---
status: open
priority: Normal
---
# Task Content`;

      vault.setFileContent(taskPath, initialContent);

      const task: Task = new NoteTask({
id: taskPath,
        text: "Task1",
        summary: "Task1",
        link: taskPath,
        status: "todo",
        priority: "",
        tags: [],
        starred: false,
        incomingLinks: [],
      })

      await addStarToTaskInVault(task, app);

      const updatedContent = vault.getFileContent(taskPath);

      expect(updatedContent).toContain("starred: true");

      // Verify no indentation on starred field (it's a top-level field)
      const lines = updatedContent.split("\n");
      expect(lines.some((line: string) => line === "starred: true")).toBe(true);
    });

    it("should update existing starred field", async () => {
      const taskPath = "TaskNotes/Tasks/Task1.md";
      const initialContent = `---
status: open
starred: false
priority: Normal
---
# Task Content`;

      vault.setFileContent(taskPath, initialContent);

      const task: Task = new NoteTask({
id: taskPath,
        text: "Task1",
        summary: "Task1",
        link: taskPath,
        status: "todo",
        priority: "",
        tags: [],
        starred: false,
        incomingLinks: [],
      })

      await addStarToTaskInVault(task, app);

      const updatedContent = vault.getFileContent(taskPath);

      expect(updatedContent).toContain("starred: true");
      expect(updatedContent).not.toContain("starred: false");
    });

    it("should preserve frontmatter structure when adding starred", async () => {
      const taskPath = "TaskNotes/Tasks/Task1.md";
      const initialContent = `---
status: open
priority: High
tags:
  - urgent
blockedBy:
  - uid: "[[Task2]]"
    reltype: FINISHTOSTART
---
# Task Content`;

      vault.setFileContent(taskPath, initialContent);

      const task: Task = new NoteTask({
id: taskPath,
        text: "Task1",
        summary: "Task1",
        link: taskPath,
        status: "todo",
        priority: "⏫",
        tags: ["urgent"],
        starred: false,
        incomingLinks: [],
      })

      await addStarToTaskInVault(task, app);

      const updatedContent = vault.getFileContent(taskPath);

      // Verify starred was added
      expect(updatedContent).toContain("starred: true");

      // Verify other fields are intact with correct indentation
      expect(updatedContent).toContain("status: open");
      expect(updatedContent).toContain("tags:");
      expect(updatedContent).toContain("  - urgent");
      expect(updatedContent).toContain("blockedBy:");
      expect(updatedContent).toContain('  - uid: "[[Task2]]"');
      expect(updatedContent).toContain("    reltype: FINISHTOSTART");
    });
  });

  describe("removeStarFromTaskInVault", () => {
    it("should update starred field to false", async () => {
      const taskPath = "TaskNotes/Tasks/Task1.md";
      const initialContent = `---
status: open
starred: true
priority: Normal
---
# Task Content`;

      vault.setFileContent(taskPath, initialContent);

      const task: Task = new NoteTask({
id: taskPath,
        text: "Task1",
        summary: "Task1",
        link: taskPath,
        status: "todo",
        priority: "",
        tags: [],
        starred: true,
        incomingLinks: [],
      })

      await removeStarFromTaskInVault(task, app);

      const updatedContent = vault.getFileContent(taskPath);

      expect(updatedContent).toContain("starred: false");
      expect(updatedContent).not.toContain("starred: true");
    });

    it("should preserve all frontmatter structure when removing star", async () => {
      const taskPath = "TaskNotes/Tasks/Task1.md";
      const initialContent = `---
status: open
starred: true
tags:
  - urgent
  - work
blockedBy:
  - uid: "[[Task2]]"
    reltype: FINISHTOSTART
---
# Task Content`;

      vault.setFileContent(taskPath, initialContent);

      const task: Task = new NoteTask({
id: taskPath,
        text: "Task1",
        summary: "Task1",
        link: taskPath,
        status: "todo",
        priority: "",
        tags: ["urgent", "work"],
        starred: true,
        incomingLinks: [],
      })

      await removeStarFromTaskInVault(task, app);

      const updatedContent = vault.getFileContent(taskPath);

      // Verify starred was changed
      expect(updatedContent).toContain("starred: false");

      // Verify all indentation is preserved
      const lines = updatedContent.split("\n");
      lines.forEach((line: string) => {
        if (line.startsWith(" ")) {
          const leadingSpaces = line.match(/^ */)?.[0].length || 0;
          expect([0, 2, 4]).toContain(leadingSpaces);
        }
      });

      // Verify all fields are intact
      expect(updatedContent).toContain("tags:");
      expect(updatedContent).toContain("  - urgent");
      expect(updatedContent).toContain("  - work");
      expect(updatedContent).toContain("blockedBy:");
      expect(updatedContent).toContain('  - uid: "[[Task2]]"');
    });
  });
});
