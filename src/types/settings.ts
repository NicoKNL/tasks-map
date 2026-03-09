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

  // Proximity color settings
  dueProximityDays: number;
  dueProximityColor: string;
  scheduleProximityDays: number;
  scheduleProximityColor: string;
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

  // Proximity color defaults
  dueProximityDays: 7,
  dueProximityColor: "#ef4444", // red-500
  scheduleProximityDays: 7,
  scheduleProximityColor: "#f59e0b", // amber-500
};
