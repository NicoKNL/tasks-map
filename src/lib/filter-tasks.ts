import { BaseTask } from "src/types/base-task";
import { traverseGraph } from "src/lib/traverse-graph";
import { FilterState } from "src/types/filter-state";

export const NO_TAGS_VALUE = "__NO_TAGS__";

const applyNonSearchFilters = (
  tasks: BaseTask[],
  filter: FilterState
): BaseTask[] => {
  let filtered = tasks;
  if (filter.selectedTags.length > 0) {
    filtered = filtered.filter((task) => {
      const noTagsSelected = filter.selectedTags.includes(NO_TAGS_VALUE);
      const regularTagsSelected = filter.selectedTags.filter(
        (tag) => tag !== NO_TAGS_VALUE
      );
      const matchesNoTags = noTagsSelected && task.tags.length === 0;
      const matchesRegularTags =
        regularTagsSelected.length > 0 &&
        regularTagsSelected.some((tag) => task.tags.includes(tag));
      return matchesNoTags || matchesRegularTags;
    });
  }
  if (filter.excludedTags.length > 0) {
    filtered = filtered.filter((task) => {
      return !filter.excludedTags.some((excludedTag) =>
        task.tags.includes(excludedTag)
      );
    });
  }
  if (filter.selectedStatuses.length > 0) {
    filtered = filtered.filter((task) =>
      filter.selectedStatuses.includes(task.status)
    );
  }
  if (filter.selectedFiles.length > 0) {
    filtered = filtered.filter((task) => {
      return filter.selectedFiles.some((selectedPath) => {
        if (selectedPath.endsWith("/")) {
          return task.link.startsWith(selectedPath);
        }
        return task.link === selectedPath;
      });
    });
  }
  if (filter.onlyStarred) {
    filtered = filtered.filter((task) => task.starred);
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
  filter: FilterState
): string[] => {
  const allowed = applyNonSearchFilters(tasks, filter);

  if (!filter.searchQuery.trim()) {
    return allowed.map((task) => task.id);
  }

  const searchMatched = applySearchFilter(allowed, filter.searchQuery);
  const seedIds = searchMatched.map((task) => task.id);
  const allowedIds = new Set(allowed.map((task) => task.id));

  return traverseGraph(seedIds, tasks, allowedIds, filter.traversalMode);
};
