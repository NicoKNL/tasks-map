import { App, Vault, parseYaml, stringifyYaml } from "obsidian";
import { BaseTask } from "./base-task";
import { TaskStatus } from "./task";

interface DependencyEntry {
  uid: string;
  reltype: string;
}

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

  async addLinkMetadata(
    vault: Vault,
    fromTask: BaseTask,
    linkingStyle: "individual" | "csv" | "dataview" = "individual"
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
   * Check if a line is within the blockedBy section
   */
  private isLineInBlockedBySection(lines: string[], lineIndex: number, frontmatterStart: number, frontmatterEnd: number): boolean {
    let blockedByLineIndex = -1;
    for (let i = frontmatterStart + 1; i < frontmatterEnd; i++) {
      if (lines[i].trim() === 'blockedBy:') {
        blockedByLineIndex = i;
        break;
      }
    }
    
    if (blockedByLineIndex === -1) {
      return false;
    }
    
    // Check if the line is after blockedBy: and before the next top-level field
    if (lineIndex <= blockedByLineIndex) {
      return false;
    }
    
    // Find the next top-level field (not indented or empty)
    for (let i = lineIndex + 1; i < frontmatterEnd; i++) {
      const line = lines[i];
      if (line.trim() !== '' && !line.startsWith(' ') && !line.startsWith('-')) {
        // This is a top-level field, so our lineIndex is before it
        return true;
      }
    }
    
    // If we reach here, the line is at the end of frontmatter, so it's in blockedBy section
    return true;
  }

  /**
   * Detect indentation style of existing blockedBy entries
   */
  private detectBlockedByIndentation(lines: string[], frontmatterStart: number, frontmatterEnd: number): { listIndent: number; itemIndent: number } {
    let blockedByLineIndex = -1;
    for (let i = frontmatterStart + 1; i < frontmatterEnd; i++) {
      if (lines[i].trim() === 'blockedBy:') {
        blockedByLineIndex = i;
        break;
      }
    }
    
    if (blockedByLineIndex === -1) {
      return { listIndent: 2, itemIndent: 4 }; // Default to standard YAML
    }
    
    // Look for existing list items after blockedBy line
    let listIndent = 2;
    let itemIndent = 4;
    
    for (let i = blockedByLineIndex + 1; i < frontmatterEnd; i++) {
      const line = lines[i];
      if (line.trim().startsWith('- uid:')) {
        // Count leading spaces for list item
        const leadingSpaces = line.match(/^ */)?.[0].length || 0;
        listIndent = leadingSpaces;
        itemIndent = leadingSpaces + 2; // reltype should be indented 2 more spaces
        break;
      }
      // Stop if we hit a non-indented line that's not part of blockedBy
      if (line.trim() !== '' && !line.startsWith(' ') && !line.startsWith('-')) {
        break;
      }
    }
    
    return { listIndent, itemIndent };
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
      const taskName =
        fromTask.text ||
        fromTask.id.split("/").pop()?.replace(/\.md$/, "") ||
        "";
      const uidValue = `[[${taskName}]]`;

      // Check if the YAML is malformed by parsing it
      const frontmatterYaml = lines
        .slice(frontmatterStart + 1, frontmatterEnd)
        .join("\n");
      const parsedYaml = parseYaml(frontmatterYaml);
      const isMalformed = Object.keys(parsedYaml).length === 0 && 
                         (frontmatterYaml.includes('blockedBy:') || 
                          frontmatterYaml.includes('- uid:'));

      if (isMalformed) {
        // Create a clean frontmatter with only essential fields and the new dependency
        const essentialFields: string[] = [];
        const bodyContent = lines.slice(frontmatterEnd + 1).join("\n");
        
        // Extract essential fields that are not part of blockedBy
        for (let i = frontmatterStart + 1; i < frontmatterEnd; i++) {
          const line = lines[i];
          if (line.trim() === 'blockedBy:' || line.trim().startsWith('- uid:') || line.trim().startsWith('reltype:')) {
            // Skip blockedBy related lines
            continue;
          }
          if (line.trim() !== '') {
            essentialFields.push(line);
          }
        }
        
        // Build new frontmatter
        const newFrontmatterLines = ['---'];
        newFrontmatterLines.push(...essentialFields);
        newFrontmatterLines.push('blockedBy:');
        newFrontmatterLines.push('  - uid: "' + uidValue + '"');
        newFrontmatterLines.push('    reltype: FINISHTOSTART');
        newFrontmatterLines.push('---');
        
        return newFrontmatterLines.join("\n") + "\n" + bodyContent;
      }

      // Check if dependency already exists using line scanning
      let dependencyExists = false;
      let blockedByLineIndex = -1;
      
      for (let i = frontmatterStart + 1; i < frontmatterEnd; i++) {
        if (lines[i].trim() === 'blockedBy:') {
          blockedByLineIndex = i;
        }
        if (lines[i].includes(uidValue)) {
          dependencyExists = true;
          break;
        }
      }

      if (dependencyExists) {
        return fileContent;
      }

      // If no blockedBy section exists, create one with default indentation
      if (blockedByLineIndex === -1) {
        // Add blockedBy section at the end of frontmatter
        lines.splice(frontmatterEnd, 0, 
          'blockedBy:',
          '  - uid: "' + uidValue + '"',
          '    reltype: FINISHTOSTART'
        );
        return lines.join("\n");
      }

      // Detect existing indentation style
      const { listIndent, itemIndent } = this.detectBlockedByIndentation(lines, frontmatterStart, frontmatterEnd);
      
      // Find the end of the blockedBy section
      let insertIndex = blockedByLineIndex + 1;
      for (let i = blockedByLineIndex + 1; i < frontmatterEnd; i++) {
        const line = lines[i];
        // Stop at first non-indented line or empty line after blockedBy
        if (line.trim() === '' || (!line.startsWith(' ') && !line.startsWith('-') && line.trim() !== '')) {
          insertIndex = i;
          break;
        }
        // Continue if it's a valid blockedBy entry
        if (line.trim().startsWith('- uid:') || line.trim().startsWith('reltype:')) {
          insertIndex = i + 1;
        } else if (line.trim() !== '') {
          // Found a line that doesn't belong to blockedBy
          insertIndex = i;
          break;
        }
      }

      // Insert new dependency with matching indentation
      const listIndentStr = ' '.repeat(listIndent);
      const itemIndentStr = ' '.repeat(itemIndent);
      
      lines.splice(insertIndex, 0,
        listIndentStr + '- uid: "' + uidValue + '"',
        itemIndentStr + 'reltype: FINISHTOSTART'
      );

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
      const { frontmatterStart, frontmatterEnd } = this.findFrontmatter(lines);

      if (frontmatterStart === -1 || frontmatterEnd === -1) {
        return fileContent;
      }

      // Extract frontmatter YAML content (excluding the --- delimiters)
      const frontmatterYaml = lines
        .slice(frontmatterStart + 1, frontmatterEnd)
        .join("\n");
      const bodyContent = lines.slice(frontmatterEnd + 1).join("\n");

      // Parse YAML into an object
      const frontmatterData = parseYaml(frontmatterYaml) || {};

      // Extract task name from the path (e.g., "TaskNotes/Tasks/Task2.md" -> "Task2")
      // The fromTaskId might be a full path or just a task name
      let taskNameToRemove = fromTaskId;
      if (fromTaskId.includes("/") || fromTaskId.endsWith(".md")) {
        taskNameToRemove =
          fromTaskId.split("/").pop()?.replace(/\.md$/, "") || fromTaskId;
      }

      const uidToRemove = `[[${taskNameToRemove}]]`;

      // Remove the dependency from blockedBy array
      if (Array.isArray(frontmatterData.blockedBy)) {
        frontmatterData.blockedBy = frontmatterData.blockedBy.filter(
          (dep: DependencyEntry) => dep && dep.uid !== uidToRemove
        );

        if (frontmatterData.blockedBy.length === 0) {
          delete frontmatterData.blockedBy;
        }
      }

      const newFrontmatterYaml = stringifyYaml(frontmatterData);

      return `---\n${newFrontmatterYaml}---\n${bodyContent}`;
    });
  }
}
