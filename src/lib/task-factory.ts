import { Task, TaskStatus } from "src/types/task";

export class TaskFactory {
	public parse(rawTask: any): Task {
		const status = rawTask.status;
		const text = rawTask.text;

		return {
			id: this.parseIdFromText(text),
			summary: this.makeSummary(text),
			text: this.cleanText(text),
			tags: this.parseTags(text),
			priority: this.parsePriority(text),
			status: this.parseStatus(status),
			link: rawTask.link?.path,
			incomingLinks: this.parseIncomingLinks(text),
		};
	}

	private cleanText(text: string): string {
		return text
			.split('\n')[0]
			.trim();
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

	private parsePriority(text: string): string  {
		// Obsidian Tasks plugin priority emoji: 🔺 (highest), ⏫ (high), 🔼 (medium), 🔽 (low), ⏬ (lowest)
		const priorityRegex = /([\u{1F53A}\u{23EB}\u{1F53C}\u{1F53D}\u{23EC}])/u;
		const priorityMatch = text.match(priorityRegex);

		if (priorityMatch) {
			return priorityMatch[1];
		}

		return "";
	}

	private parseTags(text: string): string[] {
		const tagRegex = /#([a-zA-Z0-9_-]+)/g;
		const tags = Array.from(text.matchAll(tagRegex)).map((m) => m[1]);
		return tags;
	}


	private parseStatus(status: string): TaskStatus {
		switch (status) {
			case 'x':
				return 'done';
			case '/':
				return 'in_progress';
			case '-':
				return 'canceled';
			default:
				return 'todo';
		}
	}

	private parseIncomingLinks(text: string): string[] {
		const stopSignRegex = /⛔\s*([a-zA-Z0-9]{6})/g;
		const incomingLinks = Array.from(text.matchAll(stopSignRegex)).map((m) => m[1]);
		return incomingLinks;
	}

	private makeSummary(text: string): string {
		return text
			.replace(/#[a-zA-Z0-9_-]+/g, "")
			.replace(/([\p{Extended_Pictographic}]+)(\s*[#a-zA-Z0-9_-]+)?/gu, "")
			.replace(/([\p{Extended_Pictographic}]+)/gu, "")
			.trim();
	}
}
