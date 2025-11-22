import { Task, TaskStatus, RawTask } from "src/types/task";

import {
  EMOJI_ID_PATTERN,
  DATAVIEW_ID_PATTERN,
  EMOJI_ID_PATTERN_GLOBAL,
  DATAVIEW_ID_PATTERN_GLOBAL,
  TAG_PATTERN,
  PRIORITY_PATTERN,
  CSV_LINKS_PATTERN,
  INDIVIDUAL_LINKS_PATTERN,
  DATAVIEW_DEPENDS_PATTERN,
  STAR_PATTERN,
  STAR_PATTERN_GLOBAL,
} from "./task-regex";

export class TaskFactory {
  public parse(rawTask: RawTask, type: "dataview" | "note" = "dataview"): Task {

    const status = rawTask.status;
    const text = rawTask.text;

    return {
      id: this.parseIdFromText(text),
      type: type,
      summary: this.makeSummary(text),
      text: this.cleanText(text),
      tags: this.parseTags(text),
      priority: this.parsePriority(text),
      status: this.parseStatus(status),
      link: rawTask.link.path,
      incomingLinks: this.parseIncomingLinks(text),
      starred: this.parseStarred(text),
    };
  }

  public isEmptyTask(task: Task): boolean {
    // A task is considered empty if its summary (which strips tags, IDs, emojis, etc.)
    // is empty or whitespace-only
    return task.summary.trim().length === 0;
  }

  private cleanText(text: string): string {
    return text.split("\n")[0].trim();
  }

  private parseIdFromText(text: string): string {
    // Try emoji format first: 🆔 abc123
    const idMatch = text.match(EMOJI_ID_PATTERN);

    if (idMatch) {
      return idMatch[1];
    }

    // Try Dataview format: [[id:: abc123]]
    const dataviewMatch = text.match(DATAVIEW_ID_PATTERN);

    if (dataviewMatch) {
      return dataviewMatch[1];
    }

    return Array.from({ length: 6 }, () =>
      Math.floor(Math.random() * 36).toString(36)
    ).join("");
  }

  private parsePriority(text: string): string {
    // Obsidian Tasks plugin priority emoji: 🔺 (highest), ⏫ (high), 🔼 (medium), 🔽 (low), ⏬ (lowest)
    const priorityMatch = text.match(PRIORITY_PATTERN);

    if (priorityMatch) {
      return priorityMatch[1];
    }

    return "";
  }

  private parseStarred(text: string): boolean {
    return STAR_PATTERN.test(text);
  }

  private parseTags(text: string): string[] {
    // Tag must be preceded by whitespace or line start, and is any non-whitespace after #
    const tags = Array.from(text.matchAll(TAG_PATTERN)).map((m) => m[1]);
    return tags;
  }

  private parseStatus(status: string): TaskStatus {
    switch (status) {
      case "x":
        return "done";
      case "/":
        return "in_progress";
      case "-":
        return "canceled";
      // Note-based task status values
      case "done":
        return "done";
      case "in-progress":
        return "in_progress";
      case "open":
        return "todo";
      case "none":
        return "todo";
      default:
        return "todo";
    }
  }

  private parseIncomingLinks(text: string): string[] {
    const csvIds = this.parseCsvStyleLinks(text);
    const individualIds = this.parseIndividualStyleLinks(text);
    const dataviewIds = this.parseDataviewStyleLinks(text);

    // Create set union to remove duplicates
    const allIds = new Set([...csvIds, ...individualIds, ...dataviewIds]);
    return Array.from(allIds);
  }

  private parseCsvStyleLinks(text: string): string[] {
    const csvMatches = Array.from(text.matchAll(CSV_LINKS_PATTERN));
    const ids: string[] = [];

    for (const match of csvMatches) {
      const matchedIds = match[1].split(",").map((id) => id.trim());
      ids.push(...matchedIds);
    }

    return ids;
  }

  private parseIndividualStyleLinks(text: string): string[] {
    const individualMatches = Array.from(
      text.matchAll(INDIVIDUAL_LINKS_PATTERN)
    );

    return individualMatches.map((match) => match[1]);
  }

  private parseDataviewStyleLinks(text: string): string[] {
    // Parse Dataview format: [[dependsOn:: abc123,def456]]
    const dataviewMatches = Array.from(text.matchAll(DATAVIEW_DEPENDS_PATTERN));
    const ids: string[] = [];

    for (const match of dataviewMatches) {
      const matchedIds = match[1].split(",").map((id) => id.trim());
      ids.push(...matchedIds);
    }

    return ids;
  }

  private makeSummary(text: string): string {
    return text
      .replace(/(?:^|\s)#\S+/g, "")
      .replace(EMOJI_ID_PATTERN_GLOBAL, "") // Remove task IDs: 🆔 abc123
      .replace(DATAVIEW_ID_PATTERN_GLOBAL, "") // Remove Dataview IDs: [[id:: abc123]]
      .replace(CSV_LINKS_PATTERN, "") // Remove CSV links: ⛔ abc123,def456
      .replace(INDIVIDUAL_LINKS_PATTERN, "") // Remove individual links: ⛔ abc123
      .replace(DATAVIEW_DEPENDS_PATTERN, "") // Remove Dataview dependencies: [[dependsOn:: abc123,def456]]
      .replace(STAR_PATTERN_GLOBAL, "") // Remove star emoji: ⭐
      .replace(/([\p{Extended_Pictographic}]+(\s*[#a-zA-Z0-9_-]+)?)/gu, "") // Remove other emojis
      .replace(/([\p{Extended_Pictographic}]+)/gu, "") // Remove remaining emojis
      .trim();
  }
}
