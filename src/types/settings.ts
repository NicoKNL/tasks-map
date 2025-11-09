export interface TasksMapSettings {
  showPriorities: boolean;
  showTags: boolean;

  layoutDirection: "Horizontal" | "Vertical";
  linkingStyle: "individual" | "csv" | "dataview";

  debugVisualization: boolean;

  // Tag color settings
  tagColorMode: "random" | "static";
  tagColorSeed: number;
  tagStaticColor: string;
}

export const DEFAULT_SETTINGS: TasksMapSettings = {
  showPriorities: true,
  showTags: true,

  layoutDirection: "Horizontal",
  linkingStyle: "csv",

  debugVisualization: false,

  // Tag color defaults
  tagColorMode: "random",
  tagColorSeed: 42,
  tagStaticColor: "#3b82f6",
};
