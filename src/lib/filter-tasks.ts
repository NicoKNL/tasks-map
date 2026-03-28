import { BaseTask } from "src/types/base-task";
import { TaskStatus } from "src/types/task";

export const NO_TAGS_VALUE = "__NO_TAGS__";

export const getFilteredNodeIds = (
  tasks: BaseTask[],
  selectedTags: string[],
  selectedStatuses: TaskStatus[],
  excludedTags: string[],
  selectedFiles: string[],
  searchQuery: string
): string[] => {
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
  if (searchQuery.trim()) {
    const lowerQuery = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (task) =>
        task.summary.toLowerCase().includes(lowerQuery) ||
        task.id.toLowerCase().includes(lowerQuery) ||
        task.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
    );
  }
  return filtered.map((task) => task.id);
};
