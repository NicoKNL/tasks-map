import React, { useState } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { useApp } from "src/hooks/hooks";
import { Task, TaskStatus } from "src/types/task";
import { App } from "obsidian";

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

	async function updateTaskStatusInVault(
		task: Task,
		newStatus: TaskStatus,
		app: App
	): Promise<boolean> {
		if (!task.link || !task.text) return false;
		const vault = app?.vault;
		if (!vault) return false;
		const file = vault.getFileByPath(task.link);
		if (!file) return false;
		const fileContent = await vault.read(file);
		const lines = fileContent.split(/\r?\n/);
		const taskLineIdx = lines.findIndex((line: string) =>
			line.includes(task.text)
		);
		if (taskLineIdx === -1) return false;
		await vault.modify(file, lines.join("\n"));
		return true;
	}

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

	const handleCancelTask = async (e: React.MouseEvent) => {
		e.stopPropagation();
		const newStatus: TaskStatus = "canceled";
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
					{status !== "canceled" && (
						<div
							onClick={handleCancelTask}
							style={{
								fontSize: 12,
								opacity: 0.7,
								cursor: "pointer",
							}}
						>
							Cancel
						</div>
					)}
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
			<div style={{ fontSize: 12, position: "relative", flex: 1 }}>
				{task.tags.map((tag) => (
					<span key={tag} style={{ marginRight: 6 }}>
						#{tag}
					</span>
				))}
				{/* Shortcut/link icon in bottom right */}
				{task.link && (
					<button
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
						style={{
							position: "absolute",
							bottom: 0,
							right: 0,
							background: "none",
							border: "none",
							padding: 4,
							cursor: "pointer",
							color:
								status === "done"
									? "var(--text-success)"
									: status === "canceled"
									? "var(--text-error)"
									: "var(--text-normal)",
						}}
					>
						<svg
							width="20"
							height="20"
							viewBox="0 0 20 20"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								d="M7 13L13 7M13 7H8M13 7V12"
								stroke="currentColor"
								strokeWidth="1.5"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</svg>
					</button>
				)}
			</div>
			{/* Expand/collapse button: small circle with open triangle, bottom center */}
			<button
				onClick={(e) => {
					e.stopPropagation();
					setExpanded((v) => !v);
				}}
				title={expanded ? "Collapse" : "Expand"}
				style={{
					position: "absolute",
					bottom: -16,
					left: "50%",
					transform: "translateX(-50%)",
					width: 28,
					height: 28,
					borderRadius: "50%",
					background: "var(--background-modifier-hover)",
					border: "1px solid var(--background-modifier-border)",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					boxShadow: "0 1px 4px rgba(var(--color-black-rgb),0.08)",
					zIndex: 2,
					cursor: "pointer",
				}}
			>
				<svg
					width="16"
					height="16"
					viewBox="0 0 16 16"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					style={{
						transform: expanded ? "rotate(180deg)" : undefined,
						transition: "transform 0.2s",
					}}
				>
					<path
						d="M4 6l4 4 4-4"
						stroke="currentColor"
						strokeWidth="1.5"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</svg>
			</button>
			{/* Expanded details */}
			{expanded && (
				<div
					style={{
						marginTop: 10,
						fontSize: 13,
						background: "var(--background-secondary-alt)",
						borderRadius: 6,
						padding: 8,
						boxShadow:
							"0 1px 4px rgba(var(--color-black-rgb),0.04)",
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
						<b>Priority:</b> {task.priority || "-"}
					</div>
					<div>
						<b>Link:</b> {task.link || "-"}
					</div>
					<div>
						<b>Incoming Links:</b>{" "}
						{task.incomingLinks?.join(", ") || "-"}
					</div>
				</div>
			)}
			<Handle type="source" position={Position.Right} />
		</div>
	);
}
