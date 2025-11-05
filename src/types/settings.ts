export interface TasksMapSettings {
  showPriorities: boolean;
  showTags: boolean;

  layoutDirection: "Horizontal" | "Vertical";
}

export const DEFAULT_SETTINGS: TasksMapSettings = {
  showPriorities: true,
  showTags: true,

  layoutDirection: "Horizontal",
};
