import { App, Vault } from "obsidian";
import { BaseTask } from "./base-task";
import { TaskStatus } from "./task";

/**
 * Note-based task that stores metadata in frontmatter
 */
export class NoteTask extends BaseTask {
  readonly type = "note" as const;

  async updateStatus(newStatus: TaskStatus, app: App): Promise<void> {
    if (!this.link || !this.text) return;
    const vault = app?.vault;
    if (!vault) return;
    const file = vault.getFileByPath(this.link);
    if (!file) return;

    await vault.process(file, (fileContent) => {
      const lines = fileContent.split(/\r?\n/);

      // Find frontmatter boundaries
      const { frontmatterStart, frontmatterEnd } = this.findFrontmatter(lines);

      if (frontmatterStart === -1 || frontmatterEnd === -1) {
        return fileContent;
      }

      // Map TaskStatus to note-based status format
      const noteStatus =
        newStatus === "todo"
          ? "open"
          : newStatus === "done"
            ? "done"
            : newStatus === "in_progress"
              ? "in-progress"
              : newStatus === "canceled"
                ? "canceled"
                : "open";

      // Find and update status line
      for (let i = frontmatterStart + 1; i < frontmatterEnd; i++) {
        if (lines[i].startsWith("status:")) {
          lines[i] = `status: ${noteStatus}`;
          break;
        }
      }

      return lines.join("\n");
    });
  }

  async addTaskLine(newTaskLine: string, app: App): Promise<void> {
    if (!this.link) {
      console.log("!task.link: ", newTaskLine);
      return;
    }
    const vault = app?.vault;
    if (!vault) {
      console.log("!vault: ", newTaskLine);
      return;
    }
    const originalFile = vault.getFileByPath(this.link);
    if (!originalFile) {
      console.log("!originalFile: ", newTaskLine);
      return;
    }

    const folderPath = originalFile.parent?.path;
    if (!folderPath) {
      console.log("!folderPath: ", newTaskLine);
      return;
    }

    const timestamp = Date.now();
    const newFileName = `Task-${timestamp}.md`;
    const newFilePath = `${folderPath}/${newFileName}`;

    await vault.create(newFilePath, `# ${this.text}\n\n${this.text}`);
  }

  async delete(app: App): Promise<void> {
    if (!this.link) return;
    const vault = app?.vault;
    if (!vault) return;
    const file = vault.getFileByPath(this.link);
    if (!file) return;

    await vault.delete(file);
  }

  async addStar(app: App): Promise<void> {
    if (!this.link || !this.text) return;
    const vault = app?.vault;
    if (!vault) return;
    const file = vault.getFileByPath(this.link);
    if (!file) return;

    await vault.process(file, (fileContent) => {
      const lines = fileContent.split(/\r?\n/);
      const { frontmatterStart, frontmatterEnd } = this.findFrontmatter(lines);

      if (frontmatterStart === -1 || frontmatterEnd === -1) {
        return fileContent;
      }

      // Find and update starred field, or add it if not present
      let starredLineFound = false;
      for (let i = frontmatterStart + 1; i < frontmatterEnd; i++) {
        if (lines[i].match(/^starred:\s*/)) {
          lines[i] = "starred: true";
          starredLineFound = true;
          break;
        }
      }

      if (!starredLineFound) {
        lines.splice(frontmatterEnd, 0, "starred: true");
      }

      return lines.join("\n");
    });
  }

  async removeStar(app: App): Promise<void> {
    if (!this.link || !this.text) return;
    const vault = app?.vault;
    if (!vault) return;
    const file = vault.getFileByPath(this.link);
    if (!file) return;

    await vault.process(file, (fileContent) => {
      const lines = fileContent.split(/\r?\n/);
      const { frontmatterStart, frontmatterEnd } = this.findFrontmatter(lines);

      if (frontmatterStart === -1 || frontmatterEnd === -1) {
        return fileContent;
      }

      // Find and update starred field
      for (let i = frontmatterStart + 1; i < frontmatterEnd; i++) {
        if (lines[i].match(/^starred:\s*/)) {
          lines[i] = "starred: false";
          break;
        }
      }

      return lines.join("\n");
    });
  }

  async addTag(tagToAdd: string, app: App): Promise<void> {
    if (!this.link || !this.text) return;
    const vault = app?.vault;
    if (!vault) return;
    const file = vault.getFileByPath(this.link);
    if (!file) return;

    await vault.process(file, (fileContent) => {
      const lines = fileContent.split(/\r?\n/);
      const { frontmatterStart, frontmatterEnd } = this.findFrontmatter(lines);

      if (frontmatterStart === -1 || frontmatterEnd === -1) {
        return fileContent;
      }

      // Find tags section
      let i = frontmatterStart + 1;
      let tagsLineIdx = -1;
      while (i < frontmatterEnd) {
        if (lines[i] === "tags:") {
          tagsLineIdx = i;
          break;
        }
        i++;
      }

      // If tags section doesn't exist, add it
      if (tagsLineIdx === -1) {
        lines.splice(frontmatterEnd, 0, "tags:", `  - ${tagToAdd}`);
        return lines.join("\n");
      }

      // Check if tag already exists
      i = tagsLineIdx + 1;
      while (i < frontmatterEnd && lines[i].match(/^\s{2}- /)) {
        const tagMatch = lines[i].match(/^\s{2}- (.+)$/);
        if (tagMatch && tagMatch[1] === tagToAdd) {
          // Tag already exists
          return fileContent;
        }
        i++;
      }

      // Add the tag
      lines.splice(i, 0, `  - ${tagToAdd}`);

      return lines.join("\n");
    });
  }

  async removeTag(tagToRemove: string, app: App): Promise<void> {
    if (!this.link || !this.text) return;
    const vault = app?.vault;
    if (!vault) return;
    const file = vault.getFileByPath(this.link);
    if (!file) return;

    await vault.process(file, (fileContent) => {
      const lines = fileContent.split(/\r?\n/);
      let { frontmatterStart, frontmatterEnd } = this.findFrontmatter(lines);

      if (frontmatterStart === -1 || frontmatterEnd === -1) {
        return fileContent;
      }

      // Find and remove the tag from the tags array
      let i = frontmatterStart + 1;
      while (i < frontmatterEnd) {
        const line = lines[i];
        if (line === "tags:") {
          // Found tags section, look for the tag in the following lines
          i++;
          while (i < frontmatterEnd && lines[i].match(/^\s{2}- /)) {
            const tagLine = lines[i];
            const tagMatch = tagLine.match(/^\s{2}- (.+)$/);
            if (tagMatch && tagMatch[1] === tagToRemove) {
              // Found the tag, remove it
              lines.splice(i, 1);
              frontmatterEnd--;
              break;
            }
            i++;
          }
          break;
        }
        i++;
      }

      return lines.join("\n");
    });
  }

  async addLinkMetadata(vault: Vault, fromTask: BaseTask): Promise<void> {
    await this.addDependencyToFrontmatter(vault, fromTask);
  }

  async removeLinkMetadata(vault: Vault, fromTaskId: string): Promise<void> {
    await this.removeDependencyFromFrontmatter(vault, fromTaskId);
  }

  /**
   * Helper method to find frontmatter boundaries
   */
  private findFrontmatter(lines: string[]): {
    frontmatterStart: number;
    frontmatterEnd: number;
  } {
    let frontmatterStart = -1;
    let frontmatterEnd = -1;

    if (lines[0] === "---") {
      frontmatterStart = 0;
      for (let i = 1; i < lines.length; i++) {
        if (lines[i] === "---") {
          frontmatterEnd = i;
          break;
        }
      }
    }

    return { frontmatterStart, frontmatterEnd };
  }

  /**
   * Add a dependency to this note task by updating its frontmatter
   */
  private async addDependencyToFrontmatter(
    vault: Vault,
    fromTask: BaseTask
  ): Promise<void> {
    if (!this.link) return;

    const file = vault.getFileByPath(this.link);
    if (!file) return;

    await vault.process(file, (fileContent) => {
      const lines = fileContent.split(/\r?\n/);
      const { frontmatterStart, frontmatterEnd } = this.findFrontmatter(lines);

      if (frontmatterStart === -1 || frontmatterEnd === -1) {
        return fileContent;
      }

      // Extract task name from path (e.g., "TaskNotes/Tasks/Task2.md" -> "Task2")
      const taskName = fromTask.text || fromTask.id.split("/").pop()?.replace(/\.md$/, "") || "";
      const uidValue = `[[${taskName}]]`;

      // Find or create blockedBy section
      let i = frontmatterStart + 1;
      let blockedByLineIdx = -1;
      while (i < frontmatterEnd) {
        if (lines[i] === "blockedBy:") {
          blockedByLineIdx = i;
          break;
        }
        i++;
      }

      // If blockedBy section doesn't exist, add it
      if (blockedByLineIdx === -1) {
        lines.splice(frontmatterEnd, 0, "blockedBy:", `  - uid: "${uidValue}"`, `    reltype: FINISHTOSTART`);
        return lines.join("\n");
      }

      // Check if dependency already exists
      i = blockedByLineIdx + 1;
      while (i < frontmatterEnd && lines[i].match(/^\s{2}- uid:/)) {
        const uidMatch = lines[i].match(/^\s{2}- uid: "(.+)"$/);
        if (uidMatch && uidMatch[1] === uidValue) {
          // Dependency already exists
          return fileContent;
        }
        // Skip to next item (skip reltype line)
        i++;
        if (i < frontmatterEnd && lines[i].match(/^\s{4}reltype:/)) {
          i++;
        }
      }

      // Add the dependency
      lines.splice(i, 0, `  - uid: "${uidValue}"`, `    reltype: FINISHTOSTART`);

      return lines.join("\n");
    });
  }

  /**
   * Remove a dependency from this note task by updating its frontmatter
   */
  private async removeDependencyFromFrontmatter(
    vault: Vault,
    fromTaskId: string
  ): Promise<void> {
    if (!this.link) return;

    const file = vault.getFileByPath(this.link);
    if (!file) return;

    await vault.process(file, (fileContent) => {
      const lines = fileContent.split(/\r?\n/);
      let { frontmatterStart, frontmatterEnd } = this.findFrontmatter(lines);

      if (frontmatterStart === -1 || frontmatterEnd === -1) {
        return fileContent;
      }

      // Extract task name from the path (e.g., "TaskNotes/Tasks/Task2.md" -> "Task2")
      // The fromTaskId might be a full path or just a task name
      let taskNameToRemove = fromTaskId;
      if (fromTaskId.includes("/") || fromTaskId.endsWith(".md")) {
        taskNameToRemove = fromTaskId.split("/").pop()?.replace(/\.md$/, "") || fromTaskId;
      }

      // Find and remove the dependency from blockedBy array
      let i = frontmatterStart + 1;
      while (i < frontmatterEnd) {
        const line = lines[i];
        if (line === "blockedBy:" || line.match(/^blockedBy:/)) {
          // Found blockedBy section
          i++;
          while (i < frontmatterEnd && (lines[i].match(/^\s*- uid:/) || lines[i].match(/^\s{2}- uid:/))) {
            const uidLine = lines[i];
            // Check if this uid line contains the task we're looking for
            // Match both [[TaskName]] and just TaskName
            if (uidLine.includes(`[[${taskNameToRemove}]]`) || uidLine.includes(taskNameToRemove)) {
              // Found the dependency, remove both uid and reltype lines
              lines.splice(i, 1); // Remove uid line
              frontmatterEnd--;
              // Check if next line is reltype and remove it too
              if (i < frontmatterEnd && lines[i].match(/^\s+reltype:/)) {
                lines.splice(i, 1);
                frontmatterEnd--;
              }
              break;
            }
            // Skip to next item
            i++;
            if (i < frontmatterEnd && lines[i].match(/^\s+reltype:/)) {
              i++;
            }
          }
          break;
        }
        i++;
      }

      return lines.join("\n");
    });
  }
}
