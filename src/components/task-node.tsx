import React, { useState } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { useApp } from "src/hooks/hooks";
import { Task } from "src/types/task";

export const NODEWIDTH = 250;
export const NODEHEIGHT = 120;

interface TaskNodeData {
	task: Task;
}

export default function TaskNode({ data }: NodeProps<TaskNodeData>) {
	const { task } = data;
	const [expanded, setExpanded] = useState(false);
	const [completed, setCompleted] = useState(task.completed);
	const app = useApp();

	async function updateTaskCompletedInVault(
		task: Task,
		completed: boolean,
		app: any
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
		lines[taskLineIdx] = lines[taskLineIdx].replace(
			/\[( |x)\]/,
			completed ? "[x]" : "[ ]"
		);
		await vault.modify(file, lines.join("\n"));
		return true;
	}

	const handleToggleCompleted = async (e: React.MouseEvent) => {
		e.stopPropagation();
		const newCompleted = !completed;
		const ok = await updateTaskCompletedInVault(task, newCompleted, app);
		setCompleted(newCompleted);
	};

	return (
		<div
			style={{
				background: completed
					? "var(--task-completed-green)"
					: "var(--background-secondary)",
				border: completed
					? "1px solid var(--color-green)"
					: "1px solid rgba(var(--color-black-rgb), 0.1)",
				borderRadius: "var(--radius-m)",
				padding: 12,
				width: NODEWIDTH,
				minHeight: NODEHEIGHT,
				maxHeight: expanded ? undefined : NODEHEIGHT,
				boxShadow: "0 2px 8px rgba(var(--color-black-rgb),0.07)",
				fontWeight: 500,
				color: completed ? "var(--text-success)" : "var(--text-normal)",
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
					onClick={handleToggleCompleted}
					style={{
						width: 22,
						height: 22,
						cursor: "pointer",
						marginRight: 4,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					{completed ? "✅" : "⬜"}
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
							color: completed
								? "var(--text-success)"
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
						<b>Completed:</b> {completed ? "Yes" : "No"}
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
