import { useState } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { useApp } from "src/hooks/hooks";
import { Task } from "src/types/task";
import { TaskDetails } from "./task-details";
import { ExpandButton } from "./expand-button";
import { LinkButton } from "./link-button";
import { Tag } from "./tag";
import { TaskStatusToggle } from "./task-status";
import { TaskBackground } from "./task-background";
import { TaskPriority } from "./task-priority";

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

	return (
		<TaskBackground
			status={status}
			expanded={expanded}
			width={NODEWIDTH}
			height={NODEHEIGHT}
		>
			<Handle type="target" position={Position.Left} />
			<Handle type="source" position={Position.Right} />

			<div className="task-node-header">
				<TaskStatusToggle
					status={status}
					task={task}
					onStatusChange={setStatus}
				/>
				<TaskPriority priority={task.priority} />
				<span>{task.summary}</span>
			</div>

			<div className="task-node-content">
				{task.tags.map((tag) => (
					<Tag key={tag} tag={tag} />
				))}
				<LinkButton link={task.link} app={app} taskStatus={status} />
			</div>

			<ExpandButton
				expanded={expanded}
				onClick={(e) => {
					e.stopPropagation();
					setExpanded((v) => !v);
				}}
			/>

			{expanded && <TaskDetails task={task} status={status} />}
		</TaskBackground>
	);
}
