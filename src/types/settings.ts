import { Language } from "../i18n";

export interface TasksMapSettings {
  showPriorities: boolean;
  showTags: boolean;

  taskInbox: string;

  layoutDirection: "Horizontal" | "Vertical";
  linkingStyle: "individual" | "csv" | "dataview";

  debugVisualization: boolean;

  // Tag color settings
  tagColorMode: "random" | "static";
  tagColorSeed: number;
  tagStaticColor: string;

  // Language setting
  language: Language;
}

export const DEFAULT_SETTINGS: TasksMapSettings = {
  showPriorities: true,
  showTags: true,

  taskInbox: "Task Inbox.md",

  layoutDirection: "Horizontal",
  linkingStyle: "csv",

  debugVisualization: false,

  // Tag color defaults
  tagColorMode: "random",
  tagColorSeed: 42,
  tagStaticColor: "#3b82f6",

  // Language default
  language: "en",
};
