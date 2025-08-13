import { Task, TaskStatus } from "src/types/task";

interface TaskDetailsProps {
	task: Task;
	status: TaskStatus;
}

export function TaskDetails({ task, status }: TaskDetailsProps) {
	return (
		<div
			style={{
				marginTop: 10,
				fontSize: 13,
				background: "var(--background-secondary-alt)",
				borderRadius: 6,
				padding: 8,
				boxShadow: "0 1px 4px rgba(var(--color-black-rgb),0.04)",
			}}
		>
			<div>
				<b>ID:</b> {task.id}
			</div>
			<div>
				<b>Status:</b>{" "}
				{status.charAt(0).toUpperCase() +
					status.slice(1).replace("_", " ")}
			</div>
			<div>
				<b>Summary:</b> {task.summary}
			</div>
			<div>
				<b>Tags:</b> {task.tags.join(", ")}
			</div>
			<div>
				<b>Priority:</b> {task.priority}
			</div>
			<div>
				<b>Link:</b> {task.link || "-"}
			</div>
			<div>
				<b>Incoming Links:</b> {task.incomingLinks?.join(", ") || "-"}
			</div>
		</div>
	);
}
