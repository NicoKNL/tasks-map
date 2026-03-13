import { Node, Edge } from "reactflow";
import { BaseTask } from "./base-task";

export type TaskStatus = "todo" | "in_progress" | "canceled" | "done";
export type TaskType = "dataview" | "note";

export interface RawTask {
  status: string;
  text: string;
  link: { path: string };
}

// Re-export BaseTask for convenience
export { BaseTask };

export interface TaskNodeData {
  task: BaseTask;
  layoutDirection?: "Horizontal" | "Vertical";
  showPriorities?: boolean;
  showTags?: boolean;
  debugVisualization?: boolean;
  tagColorMode?: "random" | "static";
  tagColorSeed?: number;
  tagStaticColor?: string;
  themeMode?: "light" | "dark" | "system";
  width?: number;
  height?: number;
  truncated?: boolean;
  // eslint-disable-next-line no-unused-vars
  onDeleteTask?: (taskId: string) => void;
  onCreateTasked?: (taskLine: string) => void;
  // eslint-disable-next-line no-unused-vars
  onAiNext?: (taskId: string) => Promise<void>;
  // eslint-disable-next-line no-unused-vars
  onAiBefore?: (taskId: string) => Promise<void>;
  // eslint-disable-next-line no-unused-vars
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
  // Proximity color settings
  dueProximityDays?: number;
  dueProximityColor?: string;
  scheduleProximityDays?: number;
  scheduleProximityColor?: string;
  // Date tooltip settings
  showDateTooltips?: boolean;
  tooltipMaxWidth?: number;
  tooltipSpacing?: number;
  tooltipFontSize?: number;
  tooltipCapsulePadding?: number;
  tooltipLineHeight?: number;
  tooltipVerticalOffset?: number;
}

export interface TaskEdgeData {
  hash: string;
  layoutDirection?: "Horizontal" | "Vertical";
  debugVisualization?: boolean;
}

export type TaskNode = Node<TaskNodeData, "task">;
export type TaskEdge = Edge<TaskEdgeData>;
