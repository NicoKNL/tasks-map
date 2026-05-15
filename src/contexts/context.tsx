import { createContext } from "react";
import { App } from "obsidian";

export const AppContext = createContext<App | undefined>(undefined);

interface TagsContextValue {
  allTags: string[];
  updateTaskTags: (taskId: string, newTags: string[]) => void; // eslint-disable-line no-unused-vars -- prop callback parameter convention
}

export const TagsContext = createContext<TagsContextValue>({
  allTags: [],
  updateTaskTags: () => {},
});
