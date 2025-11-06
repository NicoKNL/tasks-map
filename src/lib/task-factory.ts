import { Task, TaskStatus } from "src/types/task";

export class TaskFactory {
  public parse(rawTask: {
    status: string;
    text: string;
    link: { path: string };
  }): Task {
    const status = rawTask.status;
    const text = rawTask.text;

    return {
      id: this.parseIdFromText(text),
      summary: this.makeSummary(text),
      text: this.cleanText(text),
      tags: this.parseTags(text),
      priority: this.parsePriority(text),
      status: this.parseStatus(status),
      link: rawTask.link.path,
      incomingLinks: this.parseIncomingLinks(text),
    };
  }

  private cleanText(text: string): string {
    return text.split("\n")[0].trim();
  }

  private parseIdFromText(text: string): string {
    const idEmojiRegex = /🆔\s*([a-z0-9]{6})/;
    const idMatch = text.match(idEmojiRegex);

    if (idMatch) {
      return idMatch[1];
    }

    return Array.from({ length: 6 }, () =>
      Math.floor(Math.random() * 36).toString(36)
    ).join("");
  }

  private parsePriority(text: string): string {
    // Obsidian Tasks plugin priority emoji: 🔺 (highest), ⏫ (high), 🔼 (medium), 🔽 (low), ⏬ (lowest)
    const priorityRegex = /([\u{1F53A}\u{23EB}\u{1F53C}\u{1F53D}\u{23EC}])/u;
    const priorityMatch = text.match(priorityRegex);

    if (priorityMatch) {
      return priorityMatch[1];
    }

    return "";
  }

  private parseTags(text: string): string[] {
    // Tag must be preceded by whitespace or line start, and is any non-whitespace after #
    const tagRegex = /(?:^|\s)#(\S+)/g;
    const tags = Array.from(text.matchAll(tagRegex)).map((m) => m[1]);
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
      default:
        return "todo";
    }
  }

  private parseIncomingLinks(text: string): string[] {
    const csvIds = this.parseCsvStyleLinks(text);
    const individualIds = this.parseIndividualStyleLinks(text);

    // Create set union to remove duplicates
    const allIds = new Set([...csvIds, ...individualIds]);
    return Array.from(allIds);
  }

  private parseCsvStyleLinks(text: string): string[] {
    const csvRegex = /⛔\s*([a-zA-Z0-9]{6}(?:,[a-zA-Z0-9]{6})*)/g;
    const csvMatches = Array.from(text.matchAll(csvRegex));
    const ids: string[] = [];

    for (const match of csvMatches) {
      const matchedIds = match[1].split(",").map((id) => id.trim());
      ids.push(...matchedIds);
    }

    return ids;
  }

  private parseIndividualStyleLinks(text: string): string[] {
    const individualRegex = /⛔\s*([a-zA-Z0-9]{6})(?![a-zA-Z0-9,])/g;
    const individualMatches = Array.from(text.matchAll(individualRegex));

    return individualMatches.map((match) => match[1]);
  }

  private makeSummary(text: string): string {
    return text
      .replace(/(?:^|\s)#\S+/g, "")
      .replace(/🆔\s*[a-zA-Z0-9]{6}/g, "") // Remove task IDs: 🆔 abc123
      .replace(/⛔\s*[a-zA-Z0-9]{6}(?:,[a-zA-Z0-9]{6})*/g, "") // Remove CSV links: ⛔ abc123,def456
      .replace(/⛔\s*[a-zA-Z0-9]{6}/g, "") // Remove individual links: ⛔ abc123
      .replace(/([\p{Extended_Pictographic}]+)(\s*[#a-zA-Z0-9_-]+)?/gu, "") // Remove other emojis
      .replace(/([\p{Extended_Pictographic}]+)/gu, "") // Remove remaining emojis
      .trim();
  }
}
