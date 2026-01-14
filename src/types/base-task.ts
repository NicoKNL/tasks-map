import { App, Vault } from "obsidian";
import { TaskStatus } from "./task";

/**
 * Abstract base class for tasks.
 * Each task type (dataview, note) extends this class and implements its own behavior.
 */
export abstract class BaseTask {
  id: string;
  abstract readonly type: "dataview" | "note";
  summary: string;
  text: string;
  tags: string[];
  status: TaskStatus;
  priority: string;
  link: string;
  incomingLinks: string[];
  starred: boolean;

  constructor(data: {
    id: string;
    summary: string;
    text: string;
    tags: string[];
    status: TaskStatus;
    priority: string;
    link: string;
    incomingLinks: string[];
    starred: boolean;
  }) {
    this.id = data.id;
    this.summary = data.summary;
    this.text = data.text;
    this.tags = data.tags;
    this.status = data.status;
    this.priority = data.priority;
    this.link = data.link;
    this.incomingLinks = data.incomingLinks;
    this.starred = data.starred;
  }

  /**
   * Update the task's status in the vault
   */
  abstract updateStatus(newStatus: TaskStatus, app: App): Promise<void>;

  /**
   * Add a new task line to the vault
   */
  abstract addTaskLine(newTaskLine: string, app: App): Promise<void>;

  /**
   * Delete the task from the vault
   */
  abstract delete(app: App): Promise<void>;

  /**
   * Add a star/favorite marker to the task
   */
  abstract addStar(app: App): Promise<void>;

  /**
   * Remove the star/favorite marker from the task
   */
  abstract removeStar(app: App): Promise<void>;

  /**
   * Add a tag to the task
   */
  abstract addTag(tagToAdd: string, app: App): Promise<void>;

  /**
   * Remove a tag from the task
   */
  abstract removeTag(tagToRemove: string, app: App): Promise<void>;

  /**
   * Add link metadata to this task (for creating dependencies)
   */
  abstract addLinkMetadata(
    vault: Vault,
    fromTask: BaseTask,
    linkingStyle: "individual" | "csv" | "dataview"
  ): Promise<void>;

  /**
   * Remove link metadata from this task (for removing dependencies)
   */
  abstract removeLinkMetadata(vault: Vault, hash: string): Promise<void>;

  /**
   * Convert to plain object for serialization/compatibility
   */
  toPlainObject() {
    return {
      id: this.id,
      type: this.type,
      summary: this.summary,
      text: this.text,
      tags: this.tags,
      status: this.status,
      priority: this.priority,
      link: this.link,
      incomingLinks: this.incomingLinks,
      starred: this.starred,
    };
  }
}
