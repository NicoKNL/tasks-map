import { Vault } from "./mocks/obsidian";
import { BaseTask } from "../src/types/task";
import { NoteTask } from "../src/types/note-task";
import {
  addLinkSignsBetweenTasks,
  removeLinkSignsBetweenTasks,
} from "../src/lib/utils";

describe("Task Linking", () => {
  let vault: Vault;

  beforeEach(() => {
    vault = new Vault();
  });

  describe("Basic Operations", () => {
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

      const toTask: Task = new NoteTask({
        id: taskPath,
        text: "Task1",
        summary: "Task1",
        link: taskPath,
        status: "todo",
        priority: "",
        tags: [],
        starred: false,
        incomingLinks: [],
      });

      const fromTask: Task = new NoteTask({
        id: "TaskNotes/Tasks/Task2.md",
        text: "Task2",
        summary: "Task2",
        link: "TaskNotes/Tasks/Task2.md",
        status: "todo",
        priority: "",
        tags: [],
        starred: false,
        incomingLinks: [],
      });

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

      const toTask: Task = new NoteTask({
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

      const fromTask: Task = new NoteTask({
id: "TaskNotes/Tasks/Task3.md",
        text: "Task3",
        summary: "Task3",
        link: "TaskNotes/Tasks/Task3.md",
        status: "todo",
        priority: "",
        tags: [],
        starred: false,
        incomingLinks: [],
      })

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

    it("should not create duplicate blockedBy field when one exists with trailing whitespace", async () => {
      const taskPath = "TaskNotes/Tasks/Task1.md";
      // Simulates the real-world case where blockedBy: already exists with trailing space
      const initialContent = `---
status: open
priority: High
tags: [task, project]
blockedBy: 
- uid: "[[TaskA]]"
  reltype: FINISHTOSTART
---
# Task Content`;

      vault.setFileContent(taskPath, initialContent);

      const toTask: Task = new NoteTask({
        id: taskPath,
        text: "Task1",
        summary: "Task1",
        link: taskPath,
        status: "todo",
        priority: "",
        tags: [],
        starred: false,
        incomingLinks: [],
      });

      const fromTask: Task = new NoteTask({
        id: "TaskNotes/Tasks/TaskB.md",
        text: "TaskB",
        summary: "TaskB",
        link: "TaskNotes/Tasks/TaskB.md",
        status: "todo",
        priority: "",
        tags: [],
        starred: false,
        incomingLinks: [],
      });

      await addLinkSignsBetweenTasks(vault, fromTask, toTask, "test123");

      const updatedContent = vault.getFileContent(taskPath);
      
      // Log the actual output to see the duplicate blockedBy: fields
      console.log("=== ACTUAL FRONTMATTER (showing the bug) ===");
      console.log(updatedContent);
      console.log("=== END ===");

      // Check that both dependencies exist
      expect(updatedContent).toContain('[[TaskA]]');
      expect(updatedContent).toContain('[[TaskB]]');

      // THE KEY TEST: There should be exactly ONE "blockedBy:" in the frontmatter
      const blockedByMatches = updatedContent.match(/^blockedBy:/gm);
      expect(blockedByMatches).not.toBeNull();
      expect(blockedByMatches?.length).toBe(1);

      // Verify correct YAML structure with both dependencies
      expect(updatedContent).toContain('- uid: "[[TaskA]]"');
      expect(updatedContent).toContain('- uid: "[[TaskB]]"');
      
      // Both should have reltype
      const lines = updatedContent.split("\n");
      const uidLines = lines.filter((line: string) => line.includes("- uid:"));
      const reltypeLines = lines.filter((line: string) => line.includes("reltype:"));
      expect(uidLines.length).toBe(2);
      expect(reltypeLines.length).toBe(2);
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

      const toTask: Task = new NoteTask({
id: taskPath,
        text: "Task1",
        summary: "Task1",
        link: taskPath,
        status: "todo",
        priority: "⏫",
        tags: ["urgent", "work"],
        starred: false,
        incomingLinks: [],
      })

      const fromTask: Task = new NoteTask({
id: "TaskNotes/Tasks/Task2.md",
        text: "Task2",
        summary: "Task2",
        link: "TaskNotes/Tasks/Task2.md",
        status: "todo",
        priority: "",
        tags: [],
        starred: false,
        incomingLinks: [],
      })

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

  describe("Removal Operations", () => {
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

      const toTask: Task = new NoteTask({
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

      const toTask: Task = new NoteTask({
id: taskPath,
        text: "Task1",
        summary: "Task1",
        link: taskPath,
        status: "todo",
        priority: "",
        tags: ["work"],
        starred: false,
        incomingLinks: [],
      })

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

      const toTask: Task = new NoteTask({
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

      // Remove Task2
      await removeLinkSignsBetweenTasks(
        vault,
        toTask,
        "TaskNotes/Tasks/Task2.md"
      );

      let updatedContent = vault.getFileContent(taskPath);
      expect(updatedContent).not.toContain("[[Task2]]");

      // Add Task3
      const newFromTask: Task = new NoteTask({
id: "TaskNotes/Tasks/Task3.md",
        text: "Task3",
        summary: "Task3",
        link: "TaskNotes/Tasks/Task3.md",
        status: "todo",
        priority: "",
        tags: [],
        starred: false,
        incomingLinks: [],
      })

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

  describe("Add/Remove Cycles", () => {
    it("should maintain correct indentation after adding, removing, and adding again", async () => {
      const taskPath = "TaskNotes/Tasks/Task1.md";
      const initialContent = `---
status: open
priority: Normal
---
# Task 1 Content`;

      vault.setFileContent(taskPath, initialContent);

      const toTask: Task = new NoteTask({
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

      const fromTask1: Task = {
        id: "TaskNotes/Tasks/Task2.md",
        text: "Task2",
        summary: "Task2",
        link: "TaskNotes/Tasks/Task2.md",
        type: "note",
        status: "todo",
        priority: "",
        tags: [],
        starred: false,
        incomingLinks: [],
      };

      const fromTask2: Task = {
        id: "TaskNotes/Tasks/Task3.md",
        text: "Task3",
        summary: "Task3",
        link: "TaskNotes/Tasks/Task3.md",
        type: "note",
        status: "todo",
        priority: "",
        tags: [],
        starred: false,
        incomingLinks: [],
      };

      // Add first dependency
      await addLinkSignsBetweenTasks(vault, fromTask1, toTask);
      let content = vault.getFileContent(taskPath);
      expect(content).toContain('  - uid: "[[Task2]]"');
      expect(content).toContain("    reltype: FINISHTOSTART");

      // Add second dependency
      await addLinkSignsBetweenTasks(vault, fromTask2, toTask);
      content = vault.getFileContent(taskPath);
      expect(content).toContain('  - uid: "[[Task2]]"');
      expect(content).toContain('  - uid: "[[Task3]]"');

      // Remove first dependency
      await removeLinkSignsBetweenTasks(vault, toTask, fromTask1.id);
      content = vault.getFileContent(taskPath);
      expect(content).not.toContain("[[Task2]]");
      expect(content).toContain('  - uid: "[[Task3]]"');

      // Add first dependency back
      await addLinkSignsBetweenTasks(vault, fromTask1, toTask);
      content = vault.getFileContent(taskPath);

      // Check that BOTH dependencies have correct indentation
      const lines = content.split("\n");
      const uidLines = lines.filter((line: string) => line.includes("- uid:"));
      expect(uidLines.length).toBe(2);
      uidLines.forEach((line: string) => {
        expect(line).toMatch(/^  - uid:/);
      });

      const reltypeLines = lines.filter((line: string) =>
        line.includes("reltype:")
      );
      expect(reltypeLines.length).toBe(2);
      reltypeLines.forEach((line: string) => {
        expect(line).toMatch(/^    reltype:/);
      });
    });

    it("should maintain correct indentation with complex add/remove sequence", async () => {
      const taskPath = "TaskNotes/Tasks/MainTask.md";
      const initialContent = `---
status: open
priority: High
tags:
  - urgent
---
# Main Task`;

      vault.setFileContent(taskPath, initialContent);

      const toTask: Task = new NoteTask({
id: taskPath,
        text: "MainTask",
        summary: "MainTask",
        link: taskPath,
        status: "todo",
        priority: "",
        tags: ["urgent"],
        starred: false,
        incomingLinks: [],
      })

      const dep1: Task = {
        id: "TaskNotes/Tasks/Dependency1.md",
        text: "Dependency1",
        summary: "Dependency1",
        link: "TaskNotes/Tasks/Dependency1.md",
        type: "note",
        status: "todo",
        priority: "",
        tags: [],
        starred: false,
        incomingLinks: [],
      };

      const dep2: Task = {
        id: "TaskNotes/Tasks/Dependency2.md",
        text: "Dependency2",
        summary: "Dependency2",
        link: "TaskNotes/Tasks/Dependency2.md",
        type: "note",
        status: "todo",
        priority: "",
        tags: [],
        starred: false,
        incomingLinks: [],
      };

      // Add dep1, add dep2, remove dep1, add dep1 back
      await addLinkSignsBetweenTasks(vault, dep1, toTask);
      await addLinkSignsBetweenTasks(vault, dep2, toTask);
      await removeLinkSignsBetweenTasks(vault, toTask, dep1.id);
      await addLinkSignsBetweenTasks(vault, dep1, toTask);

      const content = vault.getFileContent(taskPath);
      const lines = content.split("\n");

      // Check all uid lines have 2-space indent
      const uidLines = lines.filter((line: string) => line.includes("- uid:"));
      expect(uidLines.length).toBe(2);
      uidLines.forEach((line: string) => {
        expect(line).toMatch(/^  - uid:/);
        expect(line).not.toMatch(/^- uid:/); // Should NOT start at column 0
      });

      // Check all reltype lines have 4-space indent
      const reltypeLines = lines.filter((line: string) =>
        line.includes("reltype:")
      );
      expect(reltypeLines.length).toBe(2);
      reltypeLines.forEach((line: string) => {
        expect(line).toMatch(/^    reltype:/);
        expect(line).not.toMatch(/^  reltype:/); // Should NOT have only 2 spaces
      });
    });

    it("should handle rapid add/remove/add cycles", async () => {
      const taskPath = "TaskNotes/Tasks/Task1.md";
      const initialContent = `---
status: open
---
# Task 1`;

      vault.setFileContent(taskPath, initialContent);

      const toTask: Task = new NoteTask({
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

      const tasks = [
        {
          id: "TaskNotes/Tasks/TaskA.md",
          text: "TaskA",
          summary: "TaskA",
          link: "TaskNotes/Tasks/TaskA.md",
          type: "note" as const,
          status: "todo" as const,
          priority: "",
          tags: [],
          starred: false,
          incomingLinks: [],
        },
        {
          id: "TaskNotes/Tasks/TaskB.md",
          text: "TaskB",
          summary: "TaskB",
          link: "TaskNotes/Tasks/TaskB.md",
          type: "note" as const,
          status: "todo" as const,
          priority: "",
          tags: [],
          starred: false,
          incomingLinks: [],
        },
        {
          id: "TaskNotes/Tasks/TaskC.md",
          text: "TaskC",
          summary: "TaskC",
          link: "TaskNotes/Tasks/TaskC.md",
          type: "note" as const,
          status: "todo" as const,
          priority: "",
          tags: [],
          starred: false,
          incomingLinks: [],
        },
      ];

      // Simulate user interaction: add A, add B, remove A, add C, remove B, add A back
      await addLinkSignsBetweenTasks(vault, tasks[0], toTask);
      await addLinkSignsBetweenTasks(vault, tasks[1], toTask);
      await removeLinkSignsBetweenTasks(vault, toTask, tasks[0].id);
      await addLinkSignsBetweenTasks(vault, tasks[2], toTask);
      await removeLinkSignsBetweenTasks(vault, toTask, tasks[1].id);
      await addLinkSignsBetweenTasks(vault, tasks[0], toTask);

      const content = vault.getFileContent(taskPath);
      const lines = content.split("\n");

      // Should have TaskC and TaskA
      expect(content).toContain("[[TaskC]]");
      expect(content).toContain("[[TaskA]]");
      expect(content).not.toContain("[[TaskB]]");

      // All lines should have correct indentation
      lines.forEach((line: string) => {
        if (line.startsWith(" ") && !line.startsWith("#")) {
          const leadingSpaces = line.match(/^ */)?.[0].length || 0;
          expect([0, 2, 4]).toContain(leadingSpaces);
        }
      });
    });

    it("should maintain correct indentation when removing from middle of list", async () => {
      const taskPath = "TaskNotes/Tasks/MainTask.md";
      const initialContent = `---
status: open
---
# Main Task`;

      vault.setFileContent(taskPath, initialContent);

      const toTask: Task = new NoteTask({
id: taskPath,
        text: "MainTask",
        summary: "MainTask",
        link: taskPath,
        status: "todo",
        priority: "",
        tags: [],
        starred: false,
        incomingLinks: [],
      })

      const tasks = ["TaskA", "TaskB", "TaskC"].map((name) => ({
        id: `TaskNotes/Tasks/${name}.md`,
        text: name,
        summary: name,
        link: `TaskNotes/Tasks/${name}.md`,
        type: "note" as const,
        status: "todo" as const,
        priority: "",
        tags: [],
        starred: false,
        incomingLinks: [],
      }));

      // Add all three
      await addLinkSignsBetweenTasks(vault, tasks[0], toTask);
      await addLinkSignsBetweenTasks(vault, tasks[1], toTask);
      await addLinkSignsBetweenTasks(vault, tasks[2], toTask);

      // Remove the middle one
      await removeLinkSignsBetweenTasks(vault, toTask, tasks[1].id);

      const content = vault.getFileContent(taskPath);
      const lines = content.split("\n");

      // Should have TaskA and TaskC, not TaskB
      expect(content).toContain("[[TaskA]]");
      expect(content).not.toContain("[[TaskB]]");
      expect(content).toContain("[[TaskC]]");

      // All remaining lines should have correct indentation
      const uidLines = lines.filter((line: string) => line.includes("- uid:"));
      expect(uidLines.length).toBe(2);

      uidLines.forEach((line: string) => {
        expect(line).toMatch(/^  - uid:/);
      });

      const reltypeLines = lines.filter((line: string) =>
        line.includes("reltype:")
      );
      expect(reltypeLines.length).toBe(2);

      reltypeLines.forEach((line: string) => {
        expect(line).toMatch(/^    reltype:/);
      });
    });
  });

  describe("Malformed Content Handling", () => {
    it("should fix entries with correct indentation when adding to existing correct content", async () => {
      const taskPath = "TaskNotes/Tasks/Task1.md";

      // This simulates content that was created by correct code
      const initialContent = `---
status: open
blockedBy:
  - uid: "[[Task2]]"
    reltype: FINISHTOSTART
---
# Task 1`;

      vault.setFileContent(taskPath, initialContent);

      const toTask: Task = new NoteTask({
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

      const fromTask3: Task = {
        id: "TaskNotes/Tasks/Task3.md",
        text: "Task3",
        summary: "Task3",
        link: "TaskNotes/Tasks/Task3.md",
        type: "note",
        status: "todo",
        priority: "",
        tags: [],
        starred: false,
        incomingLinks: [],
      };

      // Add another dependency
      await addLinkSignsBetweenTasks(vault, fromTask3, toTask);

      const content = vault.getFileContent(taskPath);
      const lines = content.split("\n");

      // Check that ALL uid lines have correct 2-space indentation
      const uidLines = lines.filter((line: string) => line.includes("- uid:"));

      uidLines.forEach((line: string) => {
        expect(line).toMatch(/^  - uid:/);
        expect(line).not.toMatch(/^- uid:/);
      });

      // Check that ALL reltype lines have correct 4-space indentation
      const reltypeLines = lines.filter((line: string) =>
        line.includes("reltype:")
      );

      reltypeLines.forEach((line: string) => {
        expect(line).toMatch(/^    reltype:/);
        expect(line).not.toMatch(/^  reltype:/);
      });
    });

    it("should handle malformed indentation (0 spaces, 2 spaces) by removing and re-adding correctly", async () => {
      const taskPath = "TaskNotes/Tasks/Task1.md";

      // This simulates content that has WRONG indentation (0 spaces, 2 spaces)
      // This could happen from manual editing or old buggy code
      const initialContent = `---
status: open
blockedBy:
- uid: "[[Task2]]"
  reltype: FINISHTOSTART
---
# Task 1`;

      vault.setFileContent(taskPath, initialContent);

      const toTask: Task = new NoteTask({
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

      const fromTask2: Task = {
        id: "TaskNotes/Tasks/Task2.md",
        text: "Task2",
        summary: "Task2",
        link: "TaskNotes/Tasks/Task2.md",
        type: "note",
        status: "todo",
        priority: "",
        tags: [],
        starred: false,
        incomingLinks: [],
      };

      // Try to remove Task2 (malformed entry)
      await removeLinkSignsBetweenTasks(vault, toTask, fromTask2.id);

      let content = vault.getFileContent(taskPath);

      // The key test: did the malformed reltype line get removed?
      expect(content).not.toContain("reltype:");
      expect(content).not.toContain("[[Task2]]");

      // Now add it back
      await addLinkSignsBetweenTasks(vault, fromTask2, toTask);

      content = vault.getFileContent(taskPath);

      const lines = content.split("\n");

      // Count all reltype lines
      const reltypeLines = lines.filter((line: string) =>
        line.includes("reltype:")
      );

      // There should be EXACTLY ONE reltype line
      expect(reltypeLines.length).toBe(1);

      // And it should have correct indentation
      expect(reltypeLines[0]).toMatch(/^    reltype:/);
    });

    it("should handle chaotic fuzzing sequence of operations", async () => {
      const taskPath = "TaskNotes/Tasks/MainTask.md";
      const initialContent = `---
status: open
---
# Main Task`;

      vault.setFileContent(taskPath, initialContent);

      const toTask: Task = new NoteTask({
id: taskPath,
        text: "MainTask",
        summary: "MainTask",
        link: taskPath,
        status: "todo",
        priority: "",
        tags: [],
        starred: false,
        incomingLinks: [],
      })

      const taskX: Task = {
        id: "TaskNotes/Tasks/TaskX.md",
        text: "TaskX",
        summary: "TaskX",
        link: "TaskNotes/Tasks/TaskX.md",
        type: "note",
        status: "todo",
        priority: "",
        tags: [],
        starred: false,
        incomingLinks: [],
      };

      const taskY: Task = {
        id: "TaskNotes/Tasks/TaskY.md",
        text: "TaskY",
        summary: "TaskY",
        link: "TaskNotes/Tasks/TaskY.md",
        type: "note",
        status: "todo",
        priority: "",
        tags: [],
        starred: false,
        incomingLinks: [],
      };

      const taskZ: Task = {
        id: "TaskNotes/Tasks/TaskZ.md",
        text: "TaskZ",
        summary: "TaskZ",
        link: "TaskNotes/Tasks/TaskZ.md",
        type: "note",
        status: "todo",
        priority: "",
        tags: [],
        starred: false,
        incomingLinks: [],
      };

      // Chaotic sequence: add, duplicate add attempts, remove, re-add, swap order, etc.
      await addLinkSignsBetweenTasks(vault, taskX, toTask); // Add X
      await addLinkSignsBetweenTasks(vault, taskX, toTask); // Try to add X again (duplicate)
      await addLinkSignsBetweenTasks(vault, taskY, toTask); // Add Y
      await addLinkSignsBetweenTasks(vault, taskX, toTask); // Try to add X again (duplicate)
      await removeLinkSignsBetweenTasks(vault, toTask, taskX.id); // Remove X
      await addLinkSignsBetweenTasks(vault, taskZ, toTask); // Add Z
      await addLinkSignsBetweenTasks(vault, taskY, toTask); // Try to add Y again (duplicate)
      await removeLinkSignsBetweenTasks(vault, toTask, taskY.id); // Remove Y
      await addLinkSignsBetweenTasks(vault, taskX, toTask); // Re-add X
      await removeLinkSignsBetweenTasks(vault, toTask, taskZ.id); // Remove Z
      await addLinkSignsBetweenTasks(vault, taskZ, toTask); // Re-add Z
      await addLinkSignsBetweenTasks(vault, taskY, toTask); // Re-add Y
      await removeLinkSignsBetweenTasks(vault, toTask, taskX.id); // Remove X
      await addLinkSignsBetweenTasks(vault, taskX, toTask); // Re-add X
      await addLinkSignsBetweenTasks(vault, taskZ, toTask); // Try to add Z again (duplicate)

      // Expected final state: Should have X, Y, Z (each exactly once)
      const content = vault.getFileContent(taskPath);
      const lines = content.split("\n");

      // Verify all three tasks are present
      expect(content).toContain("[[TaskX]]");
      expect(content).toContain("[[TaskY]]");
      expect(content).toContain("[[TaskZ]]");

      // Count uid and reltype entries
      const uidLines = lines.filter((line: string) => line.includes("- uid:"));
      const reltypeLines = lines.filter((line: string) =>
        line.includes("reltype:")
      );

      // Should have exactly 3 of each (no duplicates)
      expect(uidLines.length).toBe(3);
      expect(reltypeLines.length).toBe(3);

      // All uid lines should have correct 2-space indentation
      uidLines.forEach((line: string) => {
        expect(line).toMatch(/^  - uid:/);
        expect(line).not.toMatch(/^- uid:/); // No 0-space indentation
      });

      // All reltype lines should have correct 4-space indentation
      reltypeLines.forEach((line: string) => {
        expect(line).toMatch(/^    reltype:/);
        expect(line).not.toMatch(/^  reltype:/); // No 2-space indentation
      });

      // Verify no other indentation levels exist in frontmatter
      const frontmatterLines = lines.slice(
        lines.indexOf("---") + 1,
        lines.indexOf("---", 1)
      );
      frontmatterLines.forEach((line: string) => {
        if (line.startsWith(" ") && line.trim() !== "") {
          const leadingSpaces = line.match(/^ */)?.[0].length || 0;
          expect([2, 4]).toContain(leadingSpaces);
        }
      });

      // Verify proper YAML structure
      expect(content).toMatch(/^---\n/);
      expect(content).toMatch(/\n---\n/);
      expect(content).toContain("blockedBy:");
    });
  });
});
