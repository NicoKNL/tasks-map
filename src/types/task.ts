import { Node, Edge } from "reactflow";
import { BaseTask } from "./base-task";

export type TaskStatus = "todo" | "in_progress" | "canceled" | "done";
export type TaskType = "dataview" | "note";

export interface RawTask {
  status: string;
  text: string;
  link: { path: string };
}

// Backward compatibility: Task is now BaseTask
// All tasks are now class instances that extend BaseTask
export type Task = BaseTask;

export interface TaskNodeData {
  task: BaseTask;
  layoutDirection?: "Horizontal" | "Vertical";
  showPriorities?: boolean;
  showTags?: boolean;
  debugVisualization?: boolean;
  tagColorMode?: "random" | "static";
  tagColorSeed?: number;
  tagStaticColor?: string;
  // eslint-disable-next-line no-unused-vars
  onDeleteTask?: (taskId: string) => void;
}

export interface TaskEdgeData {
  hash: string;
  layoutDirection?: "Horizontal" | "Vertical";
  debugVisualization?: boolean;
}

export type TaskNode = Node<TaskNodeData, "task">;
export type TaskEdge = Edge<TaskEdgeData>;
