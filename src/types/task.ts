export type TaskStatus = 'todo' | 'in_progress' | 'canceled' | 'done';

export interface Task {
	id: string;
    summary: string;
	text: string;
	tags: string[];
	status: TaskStatus;  // [ ] todo, [/] in_progress, [-] canceled, [x] done
    priority: string;
	link: string;
	incomingLinks: string[];
}