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
      const { frontmatterStart, frontmatterEnd } =
        this.findFrontmatter(lines);

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
      const { frontmatterStart, frontmatterEnd } =
        this.findFrontmatter(lines);

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
      const { frontmatterStart, frontmatterEnd } =
        this.findFrontmatter(lines);

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
      const { frontmatterStart, frontmatterEnd } =
        this.findFrontmatter(lines);

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

  async addLinkMetadata(
    vault: Vault,
    fromTask: BaseTask
  ): Promise<void> {
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
      const { frontmatterStart, frontmatterEnd } =
        this.findFrontmatter(lines);

      if (frontmatterStart === -1 || frontmatterEnd === -1) {
        return fileContent;
      }

      // Find or create dependsOn section
      let i = frontmatterStart + 1;
      let dependsOnLineIdx = -1;
      while (i < frontmatterEnd) {
        if (lines[i] === "dependsOn:") {
          dependsOnLineIdx = i;
          break;
        }
        i++;
      }

      // If dependsOn section doesn't exist, add it
      if (dependsOnLineIdx === -1) {
        lines.splice(frontmatterEnd, 0, "dependsOn:", `  - ${fromTask.id}`);
        return lines.join("\n");
      }

      // Check if dependency already exists
      i = dependsOnLineIdx + 1;
      while (i < frontmatterEnd && lines[i].match(/^\s{2}- /)) {
        const depMatch = lines[i].match(/^\s{2}- (.+)$/);
        if (depMatch && depMatch[1] === fromTask.id) {
          // Dependency already exists
          return fileContent;
        }
        i++;
      }

      // Add the dependency
      lines.splice(i, 0, `  - ${fromTask.id}`);

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

      // Find and remove the dependency from dependsOn array
      let i = frontmatterStart + 1;
      while (i < frontmatterEnd) {
        const line = lines[i];
        if (line === "dependsOn:") {
          // Found dependsOn section
          i++;
          while (i < frontmatterEnd && lines[i].match(/^\s{2}- /)) {
            const depLine = lines[i];
            const depMatch = depLine.match(/^\s{2}- (.+)$/);
            if (depMatch && depMatch[1] === fromTaskId) {
              // Found the dependency, remove it
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
}
