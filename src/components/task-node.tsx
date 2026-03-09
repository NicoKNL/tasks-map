import React, { useState, useContext } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Plus } from "lucide-react";
import { useApp } from "src/hooks/hooks";
import { BaseTask, TaskNodeData } from "src/types/task";
import { TaskDetails } from "./task-details";
import { ExpandButton } from "./expand-button";
import { LinkButton } from "./link-button";
import { StarButton } from "./star-button";
import TaskMenu from "./task-menu";
import { Tag } from "./tag";
import { TaskStatusToggle } from "./task-status";
import { TaskBackground } from "./task-background";
import { TaskPriority } from "./task-priority";
import { TagInput } from "./tag-input";
import { useSummaryRenderer } from "../hooks/use-summary-renderer";
import {
  removeTagFromTaskInVault,
  addTagToTaskInVault,
  addStarToTaskInVault,
  removeStarFromTaskInVault,
} from "../lib/utils";
import { TagsContext } from "../contexts/context";
import { extractDateFromTaskText, calculateProximityColor, daysRemainingFromToday } from "../lib/utils";

export const NODEWIDTH = 250;
export const NODEHEIGHT = 120;

export default function TaskNode({ data, selected }: NodeProps<TaskNodeData>) {
  const {
    task,
    layoutDirection = "Horizontal",
    showPriorities = true,
    showTags = true,
    debugVisualization = false,
    tagColorMode = "random",
    tagColorSeed = 42,
    tagStaticColor = "#3b82f6",
    onDeleteTask,
    // Proximity color settings
    dueProximityDays = 7,
    dueProximityColor = "#ef4444",
    scheduleProximityDays = 7,
    scheduleProximityColor = "#f59e0b",
  } = data;
  const width = data.width;
  const height = data.height;

  const { allTags, updateTaskTags } = useContext(TagsContext);
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState(task.status);
  const [starred, setStarred] = useState(task.starred);
  const [tags, setTags] = useState(task.tags || []);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [tagError, setTagError] = useState(false);
  const app = useApp();
  const summaryRef = useSummaryRenderer(task.summary);

  // Calculate background color based on proximity to due/scheduled dates
  const backgroundColor = React.useMemo(() => {
    // Detect theme
    const isDarkTheme = typeof document !== 'undefined' &&
      document.documentElement.classList.contains('theme-dark');

    // Base colors for each status (approximating CSS variables)
    const baseColors = {
      todo: isDarkTheme ? "#2a2a2a" : "#f5f5f5",
      in_progress: isDarkTheme ? "#1c5e8e" : "#77b4d3",
      done: isDarkTheme ? "#1e3821" : "#6de27b",
      canceled: isDarkTheme ? "#5c1a1a" : "#ff6b6b",
    };

    const baseColor = baseColors[status];

    // Determine which date to check based on status
    if (status === "todo") {
      // Check scheduled date
      const scheduledDate = extractDateFromTaskText(task.text, "scheduled");
      if (scheduledDate) {
        const daysRemaining = daysRemainingFromToday(scheduledDate);
        if (daysRemaining <= scheduleProximityDays) {
          return calculateProximityColor(
            baseColor,
            scheduleProximityColor,
            daysRemaining,
            scheduleProximityDays
          );
        }
      }
    } else if (status === "in_progress") {
      // Check due date
      const dueDate = extractDateFromTaskText(task.text, "due");
      if (dueDate) {
        const daysRemaining = daysRemainingFromToday(dueDate);
        if (daysRemaining <= dueProximityDays) {
          return calculateProximityColor(
            baseColor,
            dueProximityColor,
            daysRemaining,
            dueProximityDays
          );
        }
      }
    }

    // Return base color if no date proximity effect applies
    return baseColor;
  }, [status, task.text, dueProximityDays, dueProximityColor, scheduleProximityDays, scheduleProximityColor]);

  const isVertical = layoutDirection === "Vertical";
  const targetPosition = isVertical ? Position.Top : Position.Left;
  const sourcePosition = isVertical ? Position.Bottom : Position.Right;

  const handleTagRemove = async (tagToRemove: string) => {
    // Immediately update the visual state
    setTags((prevTags) => {
      const updatedTags = prevTags.filter((tag) => tag !== tagToRemove);
      // Update tasks array so allTags recomputes
      updateTaskTags(task.id, updatedTags);
      return updatedTags;
    });

    try {
      await removeTagFromTaskInVault(task, tagToRemove, app);
    } catch {
      // Revert the visual change if the vault operation failed
      setTags((prevTags) => {
        const revertedTags = [...prevTags, tagToRemove];
        updateTaskTags(task.id, revertedTags);
        return revertedTags;
      });
    }
  };

  const handleAddTag = async (tagToAdd: string) => {
    if (!tagToAdd.trim()) return;

    // Don't allow tags with spaces - check before any cleaning
    if (tagToAdd.includes(" ")) {
      setTagError(true);
      // Reset after showing error briefly
      setTimeout(() => {
        setTagError(false);
        setIsAddingTag(false);
      }, 100);
      return;
    }

    const cleanTag = tagToAdd.trim().replace(/^#+/, ""); // Remove any leading #

    // Clear any previous error
    setTagError(false);

    // Don't add duplicate tags
    if (tags.includes(cleanTag)) {
      setIsAddingTag(false);
      return;
    }

    // Immediately update the visual state
    setTags((prevTags) => {
      const updatedTags = [...prevTags, cleanTag];
      // Update tasks array so allTags recomputes
      updateTaskTags(task.id, updatedTags);
      return updatedTags;
    });

    try {
      await addTagToTaskInVault(task, cleanTag, app);
    } catch {
      // Revert the visual change if the vault operation failed
      setTags((prevTags) => {
        const revertedTags = prevTags.filter((tag) => tag !== cleanTag);
        updateTaskTags(task.id, revertedTags);
        return revertedTags;
      });
    }

    // Reset input state
    setIsAddingTag(false);
  };

  const handleCancelAddTag = () => {
    setIsAddingTag(false);
    setTagError(false);
  };

  const handleStarToggle = async () => {
    const newStarred = !starred;
    // Immediately update the visual state
    setStarred(newStarred);

    try {
      if (newStarred) {
        await addStarToTaskInVault(task, app);
      } else {
        await removeStarFromTaskInVault(task, app);
      }
    } catch {
      // Revert the visual change if the vault operation failed
      setStarred(!newStarred);
    }
  };

  return (
    <TaskBackground
      status={status}
      starred={starred}
      expanded={expanded}
      debugVisualization={debugVisualization}
      selected={selected}
      width={width}
      height={height}
      backgroundColor={backgroundColor}
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
        <StarButton starred={starred} onClick={handleStarToggle} />
        <LinkButton link={task.link} app={app} taskStatus={status} task={task} />
        <TaskMenu
          task={task}
          app={app}
          onTaskDeleted={() => onDeleteTask?.(task.id)}
        />
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
              <div className="nodrag">
                <TagInput
                  allTags={allTags}
                  existingTags={tags}
                  onAddTag={handleAddTag}
                  onCancel={handleCancelAddTag}
                  hasError={tagError}
                />
              </div>
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
