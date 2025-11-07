import React, { useState } from "react";
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
import { TagInput } from "./tag-input";
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
  allTags?: string[];
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
    allTags = [],
  } = data;
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState(task.status);
  const [tags, setTags] = useState(task.tags || []);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const app = useApp();
  const summaryRef = useSummaryRenderer(task.summary);

  const isVertical = layoutDirection === "Vertical";
  const targetPosition = isVertical ? Position.Top : Position.Left;
  const sourcePosition = isVertical ? Position.Bottom : Position.Right;

  const handleTagRemove = async (tagToRemove: string) => {
    // Immediately update the visual state
    setTags((prevTags) => prevTags.filter((tag) => tag !== tagToRemove));

    try {
      await removeTagFromTaskInVault(task, tagToRemove, app);
    } catch {
      // Revert the visual change if the vault operation failed
      setTags((prevTags) => [...prevTags, tagToRemove]);
    }
  };

  const handleAddTag = async (tagToAdd: string) => {
    if (!tagToAdd.trim()) return;

    const cleanTag = tagToAdd.trim().replace(/^#+/, ""); // Remove any leading #

    // Don't add duplicate tags
    if (tags.includes(cleanTag)) {
      setIsAddingTag(false);
      return;
    }

    // Immediately update the visual state
    setTags((prevTags) => [...prevTags, cleanTag]);

    try {
      await addTagToTaskInVault(task, cleanTag, app);
    } catch {
      // Revert the visual change if the vault operation failed
      setTags((prevTags) => prevTags.filter((tag) => tag !== cleanTag));
    }

    // Reset input state
    setIsAddingTag(false);
  };

  const handleCancelAddTag = () => {
    setIsAddingTag(false);
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
        <span ref={summaryRef} className="tasks-map-task-node-summary" />
        <LinkButton link={task.link} app={app} taskStatus={status} />
      </div>

      <div className="tasks-map-task-node-content">
        {showTags && (
          <div className="task-tags-container">
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
              <TagInput
                allTags={allTags}
                existingTags={tags}
                onAddTag={handleAddTag}
                onCancel={handleCancelAddTag}
              />
            ) : (
              <span
                className="tasks-map-add-tag-button"
                onClick={() => setIsAddingTag(true)}
              >
                <Plus size={10} />
                Add tag
              </span>
            )}
          </div>
        )}
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
