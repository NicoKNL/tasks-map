import { useState } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Plus } from "lucide-react";
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
import { removeTagFromTaskInVault, addTagToTaskInVault } from "../lib/utils";

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
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagInput, setNewTagInput] = useState("");
  const app = useApp();
  const summaryRef = useSummaryRenderer(task.summary);

  const isVertical = layoutDirection === "Vertical";
  const targetPosition = isVertical ? Position.Top : Position.Left;
  const sourcePosition = isVertical ? Position.Bottom : Position.Right;

  const handleTagRemove = async (tagToRemove: string) => {
    // Immediately update the visual state
    setTags((prevTags) => prevTags.filter((tag) => tag !== tagToRemove));

    // Update the file in the background
    await removeTagFromTaskInVault(task, tagToRemove, app);
  };

  const handleAddTag = async () => {
    if (newTagInput.trim()) {
      const cleanTag = newTagInput.trim().replace(/^#+/, ""); // Remove any leading #

      // Immediately update the visual state
      setTags((prevTags) => [...prevTags, cleanTag]);

      // Update the file in the background
      await addTagToTaskInVault(task, cleanTag, app);

      // Reset input state
      setNewTagInput("");
      setIsAddingTag(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddTag();
    } else if (e.key === "Escape") {
      setNewTagInput("");
      setIsAddingTag(false);
    }
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
        {showTags && (
          <div
            className="task-tags-container"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              minHeight: "24px",
            }}
            onMouseEnter={() => {
              /* will be handled by CSS hover */
            }}
          >
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

            {/* Add tag button/input */}
            {isAddingTag ? (
              <input
                type="text"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={handleKeyPress}
                onBlur={handleAddTag}
                placeholder="Enter tag name"
                autoFocus
                style={{
                  backgroundColor: "var(--background-primary)",
                  border: "1px solid var(--background-modifier-border)",
                  borderRadius: "12px",
                  padding: "4px 8px",
                  fontSize: "12px",
                  outline: "none",
                  minWidth: "80px",
                }}
              />
            ) : (
              <span
                className="add-tag-button"
                onClick={() => setIsAddingTag(true)}
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.2)",
                  color: "white",
                  padding: "4px 8px",
                  borderRadius: "12px",
                  fontSize: "12px",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "2px",
                  opacity: 0,
                  transition: "opacity 0.2s ease",
                }}
              >
                <Plus size={12} />
                Add tag
              </span>
            )}
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
