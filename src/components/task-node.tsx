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
import { useSummaryRenderer } from "../hooks/use-summary-renderer";
import { removeTagFromTaskInVault } from "../lib/utils";

export const NODEWIDTH = 250;
export const NODEHEIGHT = 120;

interface TaskNodeData {
  task: Task;
  layoutDirection?: "Horizontal" | "Vertical";
  showPriorities?: boolean;
  showTags?: boolean;
  debugVisualization?: boolean;
  tagColorMode?: "random" | "static";
  tagColorSeed?: number;
  tagStaticColor?: string;
}

export default function TaskNode({ data }: NodeProps<TaskNodeData>) {
  const {
    task,
    layoutDirection = "Horizontal",
    showPriorities = true,
    showTags = true,
    debugVisualization = false,
    tagColorMode = "random",
    tagColorSeed = 42,
    tagStaticColor = "#3b82f6",
  } = data;
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState(task.status);
  const [tags, setTags] = useState(task.tags || []);
  const app = useApp();
  const summaryRef = useSummaryRenderer(task.summary);

  const isVertical = layoutDirection === "Vertical";
  const targetPosition = isVertical ? Position.Top : Position.Left;
  const sourcePosition = isVertical ? Position.Bottom : Position.Right;

  const handleTagRemove = async (tagToRemove: string) => {
    // Immediately update the visual state
    setTags(prevTags => prevTags.filter(tag => tag !== tagToRemove));
    
    // Update the file in the background
    await removeTagFromTaskInVault(task, tagToRemove, app);
  };

  return (
    <TaskBackground
      status={status}
      expanded={expanded}
      debugVisualization={debugVisualization}
    >
      <Handle type="target" position={targetPosition} />
      <Handle type="source" position={sourcePosition} />

      <div className="tasks-map-task-node-header">
        <TaskStatusToggle
          status={status}
          task={task}
          onStatusChange={setStatus}
        />
        {showPriorities && <TaskPriority priority={task.priority} />}
        <span ref={summaryRef} />
      </div>

      <div className="tasks-map-task-node-content">
        {showTags && tags && tags.length > 0 && (
          <div className="task-tags">
            {tags.map((tag) => (
              <Tag
                key={tag}
                tag={tag}
                tagColorMode={tagColorMode}
                tagColorSeed={tagColorSeed}
                tagStaticColor={tagStaticColor}
                onRemove={handleTagRemove}
              />
            ))}
          </div>
        )}
        <LinkButton link={task.link} app={app} taskStatus={status} />
      </div>

      {debugVisualization && (
        <ExpandButton
          expanded={expanded}
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((v) => !v);
          }}
        />
      )}

      {debugVisualization && expanded && (
        <TaskDetails task={task} status={status} />
      )}
    </TaskBackground>
  );
}
