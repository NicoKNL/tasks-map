import React, { useState } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { useApp } from "src/hooks/hooks";
import { Task, TaskStatus } from "src/types/task";
import { TaskDetails } from "./task-details";
import { ExpandButton } from "./expand-button";
import { LinkButton } from "./link-button";
import { Tag } from "./tag";
import { updateTaskStatusInVault } from "src/lib/utils";

export const NODEWIDTH = 250;
export const NODEHEIGHT = 120;

interface TaskNodeData {
	task: Task;
}

export default function TaskNode({ data }: NodeProps<TaskNodeData>) {
	const { task } = data;
	const [expanded, setExpanded] = useState(false);
	const [status, setStatus] = useState(task.status);
	const app = useApp();

	const handleToggleStatus = async (e: React.MouseEvent) => {
		e.stopPropagation();
		// Cycle through statuses: todo -> in_progress -> done
		// (canceled status is set through a separate action)
		const statusCycle: TaskStatus[] = ["todo", "in_progress", "done"];
		const currentIndex = statusCycle.indexOf(status);
		const newStatus = statusCycle[(currentIndex + 1) % statusCycle.length];
		const ok = await updateTaskStatusInVault(task, newStatus, app!);
		if (ok) setStatus(newStatus);
	};

	return (
		<div
			style={{
				background:
					status === "done"
						? "var(--task-completed-green)"
						: status === "in_progress"
						? "var(--task-in-progress-blue)"
						: status === "canceled"
						? "var(--task-canceled-red)"
						: "var(--background-secondary)",
				border:
					status === "done"
						? "1px solid var(--color-green)"
						: status === "in_progress"
						? "1px solid var(--color-blue)"
						: status === "canceled"
						? "1px solid var(--color-red)"
						: "1px solid rgba(var(--color-black-rgb), 0.1)",
				borderRadius: "var(--radius-m)",
				padding: 12,
				width: NODEWIDTH,
				minHeight: NODEHEIGHT,
				maxHeight: expanded ? undefined : NODEHEIGHT,
				boxShadow: "0 2px 8px rgba(var(--color-black-rgb),0.07)",
				fontWeight: 500,
				color:
					status === "done"
						? "var(--text-success)"
						: status === "in_progress"
						? "var(--color-blue)"
						: status === "canceled"
						? "var(--text-error)"
						: "var(--text-normal)",
				display: "flex",
				flexDirection: "column",
				gap: 4,
				position: "relative",
				transition: "max-height 0.2s, min-height 0.2s, width 0.2s",
			}}
		>
			<Handle type="target" position={Position.Left} />
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: 8,
					marginBottom: 2,
				}}
			>
				<div
					style={{
						display: "flex",
						gap: 8,
						alignItems: "center",
					}}
				>
					<div
						onClick={handleToggleStatus}
						style={{
							width: 22,
							height: 22,
							cursor: "pointer",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						{status === "todo" && "⬜"}
						{status === "in_progress" && "🔵"}
						{status === "done" && "✅"}
						{status === "canceled" && "❌"}
					</div>
				</div>
				{/* Priority and summary */}
				{task.priority && (
					<span
						title="Priority"
						style={{
							fontSize: 18,
							lineHeight: 1,
						}}
					>
						{task.priority}
					</span>
				)}
				<span>{task.summary}</span>
			</div>
			<div style={{ position: "relative", flex: 1 }}>
				{task.tags.map((tag) => (
					<Tag key={tag} tag={tag} />
				))}
				{/* Shortcut/link icon in bottom right */}
				{task.link && (
					<LinkButton
						title="Open file"
						onClick={(e) => {
							e.stopPropagation();
							if (app && app.workspace) {
								app.workspace.openLinkText(
									task.link!,
									"/",
									false
								);
							}
						}}
						status={
							status === "done"
								? "success"
								: status === "canceled"
								? "error"
								: "normal"
						}
					/>
				)}
			</div>
			{/* Expand/collapse button */}
			<ExpandButton
				expanded={expanded}
				onClick={(e) => {
					e.stopPropagation();
					setExpanded((v) => !v);
				}}
			/>
			{expanded && <TaskDetails task={task} status={status} />}
			<Handle type="source" position={Position.Right} />
		</div>
	);
}
