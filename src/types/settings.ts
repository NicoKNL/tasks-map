export interface TasksMapSettings {
  showPriorities: boolean;
  showTags: boolean;

  layoutDirection: "Horizontal" | "Vertical";
  linkingStyle: "individual" | "csv";
}

export const DEFAULT_SETTINGS: TasksMapSettings = {
  showPriorities: true,
  showTags: true,

  layoutDirection: "Horizontal",
  linkingStyle: "csv",
};
