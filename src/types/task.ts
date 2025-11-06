import { Node, Edge } from "reactflow";

export type TaskStatus = "todo" | "in_progress" | "canceled" | "done";

export interface Task {
  id: string;
  summary: string;
  text: string;
  tags: string[];
  status: TaskStatus; // [ ] todo, [/] in_progress, [-] canceled, [x] done
  priority: string;
  link: string;
  incomingLinks: string[];
}

export interface TaskNodeData {
  task: Task;
  layoutDirection?: "Horizontal" | "Vertical";
  showPriorities?: boolean;
  showTags?: boolean;
  debugVisualization?: boolean;
}

export interface TaskEdgeData {
  hash: string;
  layoutDirection?: "Horizontal" | "Vertical";
  debugVisualization?: boolean;
}

export type TaskNode = Node<TaskNodeData, "task">;
export type TaskEdge = Edge<TaskEdgeData>;
