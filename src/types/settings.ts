export interface TasksMapSettings {
  showPriorities: boolean;
  showTags: boolean;
  showStatuses: boolean;

  layoutDirection: "Horizontal" | "Vertical";
  nodeSpacing: number;
}

export const DEFAULT_SETTINGS: TasksMapSettings = {
  showPriorities: true,
  showTags: true,
  showStatuses: true,

  layoutDirection: "Horizontal",
  nodeSpacing: 150,
};
