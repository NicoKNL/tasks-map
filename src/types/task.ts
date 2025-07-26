export interface Task {
	id: string;
    summary: string;
	text: string;
	tags: string[];
	completed?: boolean;
    priority?: string | undefined;
	link?: string | undefined;
	incomingLinks: string[];
}