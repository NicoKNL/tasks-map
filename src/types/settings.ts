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

  // Date tooltip settings
  showDateTooltips: boolean;
  tooltipMaxWidth: number;
  tooltipSpacing: number;
  tooltipFontSize: number;
  tooltipCapsulePadding: number;
  tooltipLineHeight: number;
  tooltipVerticalOffset: number;

  // AI settings
  aiEnabled: boolean;
  aiProvider: string;
  aiModel: string;
  aiApiKey: string;
  aiBaseUrl: string;
  aiPrompt: string;
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

  // Date tooltip defaults
  showDateTooltips: true,
  tooltipMaxWidth: 250,
  tooltipSpacing: 6,
  tooltipFontSize: 11,
  tooltipCapsulePadding: 4,
  tooltipLineHeight: 1.5,
  tooltipVerticalOffset: 8,

  // AI settings defaults
  aiEnabled: false,
  aiProvider: "openai",
  aiModel: "gpt-4o-mini",
  aiApiKey: "",
  aiBaseUrl: "https://api.openai.com/v1",
  aiPrompt: "Given the following task and its related tasks, predict the next logical task. Return only the task description in plain text, without any markdown formatting, numbering, or additional explanation.\n\nCurrent task: {currentTask}\n\nRelated tasks:\n{relatedTasks}\n\nNext task:",
};
