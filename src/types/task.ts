import { Node, Edge } from "reactflow";

export type TaskStatus = "todo" | "in_progress" | "canceled" | "done";
export type TaskType = "dataview" | "note";

export interface RawTask {
  status: string;
  text: string;
  link: { path: string };
}

export interface Task {
  id: string;
  type: TaskType; // How to identify this task for linking
  summary: string;
  text: string;
  tags: string[];
  status: TaskStatus; // [ ] todo, [/] in_progress, [-] canceled, [x] done
  priority: string;
  link: string;
  incomingLinks: string[]; // References to other tasks (format depends on type)
}

export interface TaskNodeData {
  task: Task;
  layoutDirection?: "Horizontal" | "Vertical";
  showPriorities?: boolean;
  showTags?: boolean;
  debugVisualization?: boolean;
  tagColorMode?: "random" | "static";
  tagColorSeed?: number;
  tagStaticColor?: string;
}

export interface TaskEdgeData {
  hash: string;
  layoutDirection?: "Horizontal" | "Vertical";
  debugVisualization?: boolean;
}

export type TaskNode = Node<TaskNodeData, "task">;
export type TaskEdge = Edge<TaskEdgeData>;
