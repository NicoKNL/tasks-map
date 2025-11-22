import { Vault } from './mocks/obsidian';
import { Task } from '../src/types/task';
import {
  addLinkSignsBetweenTasks,
  removeLinkSignsBetweenTasks,
} from '../src/lib/utils';

describe("Note-based Task Dependency Management", () => {
  let vault: Vault;

  beforeEach(() => {
    vault = new Vault();
  });

  describe("addDependencyToNoteTask", () => {
    it("should add a dependency to a note without existing blockedBy field", async () => {
      const taskPath = "TaskNotes/Tasks/Task1.md";
      const initialContent = `---
status: open
priority: Normal
tags:
  - project
---
# Task 1 Content`;

      vault.setFileContent(taskPath, initialContent);

      const toTask: Task = {
        id: taskPath,
        text: "Task1",
        link: taskPath,
        type: "note",
        status: "todo",
        priority: "",
        tags: [],
        starred: false,
        incomingLinks: [],
      };

      const fromTask: Task = {
        id: "TaskNotes/Tasks/Task2.md",
        text: "Task2",
        link: "TaskNotes/Tasks/Task2.md",
        type: "note",
        status: "todo",
        priority: "",
        tags: [],
        starred: false,
        incomingLinks: [],
      };

      await addLinkSignsBetweenTasks(vault, fromTask, toTask, "abc123");

      const updatedContent = vault.getFileContent(taskPath);

      // Check that blockedBy was added with correct indentation
      expect(updatedContent).toContain("blockedBy:");
      expect(updatedContent).toContain('  - uid: "[[Task2]]"');
      expect(updatedContent).toContain("    reltype: FINISHTOSTART");

      // Verify frontmatter structure is preserved
      expect(updatedContent).toMatch(/^---\n/);
      expect(updatedContent).toMatch(/\n---\n/);

      // Verify original fields are intact
      expect(updatedContent).toContain("status: open");
      expect(updatedContent).toContain("priority: Normal");
      expect(updatedContent).toContain("tags:");
      expect(updatedContent).toContain("  - project");
    });

    it("should add a second dependency to existing blockedBy field", async () => {
      const taskPath = "TaskNotes/Tasks/Task1.md";
      const initialContent = `---
status: open
blockedBy:
  - uid: "[[Task2]]"
    reltype: FINISHTOSTART
---
# Task 1 Content`;

      vault.setFileContent(taskPath, initialContent);

      const toTask: Task = {
        id: taskPath,
        text: "Task1",
        link: taskPath,
        type: "note",
        status: "todo",
        priority: "",
        tags: [],
        starred: false,
        incomingLinks: [],
      };

      const fromTask: Task = {
        id: "TaskNotes/Tasks/Task3.md",
        text: "Task3",
        link: "TaskNotes/Tasks/Task3.md",
        type: "note",
        status: "todo",
        priority: "",
        tags: [],
        starred: false,
        incomingLinks: [],
      };

      await addLinkSignsBetweenTasks(vault, fromTask, toTask, "def456");

      const updatedContent = vault.getFileContent(taskPath);

      // Check that both dependencies exist
      expect(updatedContent).toContain('  - uid: "[[Task2]]"');
      expect(updatedContent).toContain('  - uid: "[[Task3]]"');

      // Verify correct indentation (2 spaces for list items, 4 for nested fields)
      const lines = updatedContent.split("\n");
      const uidLines = lines.filter((line: string) => line.includes("uid:"));
      uidLines.forEach((line: string) => {
        expect(line).toMatch(/^  - uid:/);
      });

      const reltypeLines = lines.filter((line: string) =>
        line.includes("reltype:")
      );
      reltypeLines.forEach((line: string) => {
        expect(line).toMatch(/^    reltype:/);
      });
    });

    it("should preserve frontmatter indentation when adding dependencies", async () => {
      const taskPath = "TaskNotes/Tasks/Task1.md";
      const initialContent = `---
status: open
priority: High
tags:
  - urgent
  - work
---
# Task Content`;

      vault.setFileContent(taskPath, initialContent);

      const toTask: Task = {
        id: taskPath,
        text: "Task1",
        link: taskPath,
        type: "note",
        status: "todo",
        priority: "⏫",
        tags: ["urgent", "work"],
        starred: false,
        incomingLinks: [],
      };

      const fromTask: Task = {
        id: "TaskNotes/Tasks/Task2.md",
        text: "Task2",
        link: "TaskNotes/Tasks/Task2.md",
        type: "note",
        status: "todo",
        priority: "",
        tags: [],
        starred: false,
        incomingLinks: [],
      };

      await addLinkSignsBetweenTasks(vault, fromTask, toTask, "xyz789");

      const updatedContent = vault.getFileContent(taskPath);
      const lines = updatedContent.split("\n");

      // Verify all indentation is correct
      expect(lines.some((line: string) => line === "tags:")).toBe(true);
      expect(lines.some((line: string) => line === "  - urgent")).toBe(true);
      expect(lines.some((line: string) => line === "  - work")).toBe(true);
      expect(lines.some((line: string) => line === "blockedBy:")).toBe(true);
      expect(
        lines.some((line: string) => line === '  - uid: "[[Task2]]"')
      ).toBe(true);
      expect(
        lines.some((line: string) => line === "    reltype: FINISHTOSTART")
      ).toBe(true);

      // Ensure no lines have incorrect indentation (e.g., 3 spaces, tabs, etc.)
      lines.forEach((line: string) => {
        if (line.startsWith(" ")) {
          const leadingSpaces = line.match(/^ */)?.[0].length || 0;
          // Only allow 0, 2, or 4 spaces
          expect([0, 2, 4]).toContain(leadingSpaces);
        }
      });
    });
  });

  describe("removeDependencyFromNoteTask", () => {
    it("should remove a dependency from blockedBy field", async () => {
      const taskPath = "TaskNotes/Tasks/Task1.md";
      const initialContent = `---
status: open
blockedBy:
  - uid: "[[Task2]]"
    reltype: FINISHTOSTART
  - uid: "[[Task3]]"
    reltype: FINISHTOSTART
---
# Task Content`;

      vault.setFileContent(taskPath, initialContent);

      const toTask: Task = {
        id: taskPath,
        text: "Task1",
        link: taskPath,
        type: "note",
        status: "todo",
        priority: "",
        tags: [],
        starred: false,
        incomingLinks: [],
      };

      const fromTaskId = "TaskNotes/Tasks/Task2.md";

      await removeLinkSignsBetweenTasks(vault, toTask, fromTaskId);

      const updatedContent = vault.getFileContent(taskPath);

      // Task2 should be removed
      expect(updatedContent).not.toContain("[[Task2]]");

      // Task3 should remain
      expect(updatedContent).toContain("[[Task3]]");
      expect(updatedContent).toContain('  - uid: "[[Task3]]"');
      expect(updatedContent).toContain("    reltype: FINISHTOSTART");

      // Verify indentation is still correct
      const lines = updatedContent.split("\n");
      lines.forEach((line: string) => {
        if (line.startsWith(" ")) {
          const leadingSpaces = line.match(/^ */)?.[0].length || 0;
          expect([0, 2, 4]).toContain(leadingSpaces);
        }
      });
    });

    it("should preserve frontmatter structure when removing last dependency", async () => {
      const taskPath = "TaskNotes/Tasks/Task1.md";
      const initialContent = `---
status: open
priority: Normal
blockedBy:
  - uid: "[[Task2]]"
    reltype: FINISHTOSTART
tags:
  - work
---
# Task Content`;

      vault.setFileContent(taskPath, initialContent);

      const toTask: Task = {
        id: taskPath,
        text: "Task1",
        link: taskPath,
        type: "note",
        status: "todo",
        priority: "",
        tags: ["work"],
        starred: false,
        incomingLinks: [],
      };

      const fromTaskId = "TaskNotes/Tasks/Task2.md";

      await removeLinkSignsBetweenTasks(vault, toTask, fromTaskId);

      const updatedContent = vault.getFileContent(taskPath);

      // Dependency should be removed
      expect(updatedContent).not.toContain("[[Task2]]");

      // Other fields should be intact
      expect(updatedContent).toContain("status: open");
      expect(updatedContent).toContain("priority: Normal");
      expect(updatedContent).toContain("tags:");
      expect(updatedContent).toContain("  - work");

      // Frontmatter should still be valid
      expect(updatedContent).toMatch(/^---\n/);
      expect(updatedContent).toMatch(/\n---\n/);
    });

    it("should handle relinking (remove then add)", async () => {
      const taskPath = "TaskNotes/Tasks/Task1.md";
      const initialContent = `---
status: open
blockedBy:
  - uid: "[[Task2]]"
    reltype: FINISHTOSTART
---
# Task Content`;

      vault.setFileContent(taskPath, initialContent);

      const toTask: Task = {
        id: taskPath,
        text: "Task1",
        link: taskPath,
        type: "note",
        status: "todo",
        priority: "",
        tags: [],
        starred: false,
        incomingLinks: [],
      };

      // Remove Task2
      await removeLinkSignsBetweenTasks(
        vault,
        toTask,
        "TaskNotes/Tasks/Task2.md"
      );

      let updatedContent = vault.getFileContent(taskPath);
      expect(updatedContent).not.toContain("[[Task2]]");

      // Add Task3
      const newFromTask: Task = {
        id: "TaskNotes/Tasks/Task3.md",
        text: "Task3",
        link: "TaskNotes/Tasks/Task3.md",
        type: "note",
        status: "todo",
        priority: "",
        tags: [],
        starred: false,
        incomingLinks: [],
      };

      await addLinkSignsBetweenTasks(vault, newFromTask, toTask, "new123");

      updatedContent = vault.getFileContent(taskPath);

      // Only Task3 should exist
      expect(updatedContent).not.toContain("[[Task2]]");
      expect(updatedContent).toContain("[[Task3]]");
      expect(updatedContent).toContain('  - uid: "[[Task3]]"');
      expect(updatedContent).toContain("    reltype: FINISHTOSTART");

      // Verify indentation is correct after relink
      const lines = updatedContent.split("\n");
      lines.forEach((line: string) => {
        if (line.startsWith(" ")) {
          const leadingSpaces = line.match(/^ */)?.[0].length || 0;
          expect([0, 2, 4]).toContain(leadingSpaces);
        }
      });
    });
  });
});
