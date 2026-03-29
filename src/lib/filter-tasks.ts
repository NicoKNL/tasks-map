import { BaseTask } from "src/types/base-task";
import { TaskStatus } from "src/types/task";
import { traverseGraph, TraversalMode } from "src/lib/traverse-graph";

export const NO_TAGS_VALUE = "__NO_TAGS__";

const applyNonSearchFilters = (
  tasks: BaseTask[],
  selectedTags: string[],
  selectedStatuses: TaskStatus[],
  excludedTags: string[],
  selectedFiles: string[]
): BaseTask[] => {
  let filtered = tasks;
  if (selectedTags.length > 0) {
    filtered = filtered.filter((task) => {
      const noTagsSelected = selectedTags.includes(NO_TAGS_VALUE);
      const regularTagsSelected = selectedTags.filter(
        (tag) => tag !== NO_TAGS_VALUE
      );
      const matchesNoTags = noTagsSelected && task.tags.length === 0;
      const matchesRegularTags =
        regularTagsSelected.length > 0 &&
        regularTagsSelected.some((tag) => task.tags.includes(tag));
      return matchesNoTags || matchesRegularTags;
    });
  }
  if (excludedTags.length > 0) {
    filtered = filtered.filter((task) => {
      return !excludedTags.some((excludedTag) =>
        task.tags.includes(excludedTag)
      );
    });
  }
  if (selectedStatuses.length > 0) {
    filtered = filtered.filter((task) =>
      selectedStatuses.includes(task.status)
    );
  }
  if (selectedFiles.length > 0) {
    filtered = filtered.filter((task) => {
      return selectedFiles.some((selectedPath) => {
        if (selectedPath.endsWith("/")) {
          return task.link.startsWith(selectedPath);
        }
        return task.link === selectedPath;
      });
    });
  }
  return filtered;
};

const applySearchFilter = (
  tasks: BaseTask[],
  searchQuery: string
): BaseTask[] => {
  if (!searchQuery.trim()) return tasks;
  const lowerQuery = searchQuery.toLowerCase();
  return tasks.filter(
    (task) =>
      task.summary.toLowerCase().includes(lowerQuery) ||
      task.id.toLowerCase().includes(lowerQuery) ||
      task.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
  );
};

export const getFilteredNodeIds = (
  tasks: BaseTask[],
  selectedTags: string[],
  selectedStatuses: TaskStatus[],
  excludedTags: string[],
  selectedFiles: string[],
  searchQuery: string,
  traversalMode: TraversalMode = "match"
): string[] => {
  const allowed = applyNonSearchFilters(
    tasks,
    selectedTags,
    selectedStatuses,
    excludedTags,
    selectedFiles
  );

  if (!searchQuery.trim()) {
    return allowed.map((task) => task.id);
  }

  const searchMatched = applySearchFilter(allowed, searchQuery);
  const seedIds = searchMatched.map((task) => task.id);
  const allowedIds = new Set(allowed.map((task) => task.id));

  return traverseGraph(seedIds, tasks, allowedIds, traversalMode);
};
