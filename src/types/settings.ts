export interface TasksMapSettings {
  showPriorities: boolean;
  showTags: boolean;

  layoutDirection: "Horizontal" | "Vertical";
  linkingStyle: "individual" | "csv";

  debugVisualization: boolean;
}

export const DEFAULT_SETTINGS: TasksMapSettings = {
  showPriorities: true,
  showTags: true,

  layoutDirection: "Horizontal",
  linkingStyle: "csv",

  debugVisualization: false,
};
