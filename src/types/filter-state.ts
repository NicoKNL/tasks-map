import { TaskStatus } from "./task";
import type { TraversalMode } from "src/lib/traverse-graph";

export interface FilterState {
  selectedTags: string[];
  excludedTags: string[];
  selectedStatuses: TaskStatus[];
  selectedFiles: string[];
  searchQuery: string;
  traversalMode: TraversalMode;
  onlyStarred: boolean;
}

export const DEFAULT_FILTER_STATE: FilterState = {
  selectedTags: [],
  excludedTags: [],
  selectedStatuses: ["todo", "in_progress", "done", "canceled"],
  selectedFiles: [],
  searchQuery: "",
  traversalMode: "match",
  onlyStarred: false,
};
