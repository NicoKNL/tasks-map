import React, { useState, useEffect, useRef } from "react";
import { ReactFlowProvider } from "reactflow";
import { AppContext } from "src/contexts/context";
import TaskMapGraphView from "./TaskMapGraphView";
import type TasksMapPlugin from "../main";
import { TasksMapSettings } from "src/types/settings";
import { FilterState, DEFAULT_FILTER_STATE } from "src/types/filter-state";
import { EmbedConfig, DEFAULT_EMBED_CONFIG } from "src/types/embed-config";
import { TaskStatus } from "src/types/task";

// Discriminated result type for filterStateFromSource
export type ParseResult =
  | { kind: "ok"; filter: FilterState; config: EmbedConfig }
  | { kind: "legacy" }
  | { kind: "invalid" };

export interface ParsedEmbed {
  filter: FilterState;
  config: EmbedConfig;
}

interface TaskMapGraphEmbedViewProps {
  plugin: TasksMapPlugin;
  initialFilter: FilterState;
  embedConfig: EmbedConfig;
}

export default function TaskMapGraphEmbedView({
  plugin,
  initialFilter,
  embedConfig,
}: TaskMapGraphEmbedViewProps) {
  const [settings, setSettings] = useState<TasksMapSettings>({
    ...plugin.settings,
  });

  const [filterState, setFilterState] = useState<FilterState>({
    ...DEFAULT_FILTER_STATE,
    ...initialFilter,
  });

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.height = `${embedConfig.height}px`;
    }
  }, [embedConfig.height]);

  useEffect(() => {
    const handler = () => setSettings({ ...plugin.settings });
    window.addEventListener("tasks-map:settings-changed", handler);
    return () =>
      window.removeEventListener("tasks-map:settings-changed", handler);
  }, [plugin]);

  return (
    <AppContext.Provider value={plugin.app}>
      <div className="tasks-map-embed-container" ref={containerRef}>
        <ReactFlowProvider>
          <TaskMapGraphView
            settings={settings}
            filterState={filterState}
            setFilterState={setFilterState}
            plugin={plugin}
            embedConfig={embedConfig}
          />
        </ReactFlowProvider>
      </div>
    </AppContext.Provider>
  );
}

export function TaskMapEmbedError({ message }: { message: string }) {
  return (
    <div className="tasks-map-embed-error" role="alert">
      <span className="tasks-map-embed-error__icon" aria-hidden="true">
        ⚠️
      </span>
      <span className="tasks-map-embed-error__message">{message}</span>
    </div>
  );
}

/**
 * Coerce a raw value to boolean; returns `defaultVal` when the value is not a
 * boolean (handles the case where users manually edit the JSON with strings
 * like `"false"` or numbers).
 */
function coerceBool(value: unknown, defaultVal: boolean): boolean {
  if (typeof value === "boolean") return value;
  return defaultVal;
}

/**
 * Coerce a raw value to a positive number; returns `defaultVal` for
 * non-numbers, NaN, Infinity, or non-positive values.
 */
function coercePositiveNumber(value: unknown, defaultVal: number): number {
  if (typeof value === "number" && isFinite(value) && value > 0) return value;
  return defaultVal;
}

/**
 * Coerce a raw value to an array of strings; returns `defaultVal` for
 * non-arrays or arrays that contain non-string elements.
 */
function coerceStringArray(value: unknown, defaultVal: string[]): string[] {
  if (Array.isArray(value) && value.every((v) => typeof v === "string")) {
    return value as string[];
  }
  return defaultVal;
}

/**
 * Validate and coerce raw parsed config fields into a valid EmbedConfig,
 * falling back to defaults for any field that has an incorrect type.
 */
function coerceEmbedConfig(raw: Record<string, unknown>): EmbedConfig {
  return {
    height: coercePositiveNumber(raw.height, DEFAULT_EMBED_CONFIG.height),
    showMinimap: coerceBool(raw.showMinimap, DEFAULT_EMBED_CONFIG.showMinimap),
    showFilterPanel: coerceBool(
      raw.showFilterPanel,
      DEFAULT_EMBED_CONFIG.showFilterPanel
    ),
    showPresetsPanel: coerceBool(
      raw.showPresetsPanel,
      DEFAULT_EMBED_CONFIG.showPresetsPanel
    ),
    showUnlinkedPanel: coerceBool(
      raw.showUnlinkedPanel,
      DEFAULT_EMBED_CONFIG.showUnlinkedPanel
    ),
    hideUnlinkedTasks: coerceBool(
      raw.hideUnlinkedTasks,
      DEFAULT_EMBED_CONFIG.hideUnlinkedTasks
    ),
    showStatusCounts: coerceBool(
      raw.showStatusCounts,
      DEFAULT_EMBED_CONFIG.showStatusCounts
    ),
  };
}

const VALID_TRAVERSAL_MODES = [
  "match",
  "upstream",
  "downstream",
  "both",
] as const;
type TraversalMode = (typeof VALID_TRAVERSAL_MODES)[number];

function isValidTraversalMode(value: unknown): value is TraversalMode {
  return (
    typeof value === "string" &&
    (VALID_TRAVERSAL_MODES as readonly string[]).includes(value)
  );
}

const VALID_TASK_STATUSES: TaskStatus[] = [
  "todo",
  "in_progress",
  "canceled",
  "done",
];

/**
 * Coerce a raw value to an array of valid TaskStatus values; returns
 * `defaultVal` when the value is not an array or contains any invalid status.
 */
function coerceTaskStatuses(
  value: unknown,
  defaultVal: TaskStatus[]
): TaskStatus[] {
  if (
    Array.isArray(value) &&
    value.every(
      (v): v is TaskStatus =>
        typeof v === "string" && (VALID_TASK_STATUSES as string[]).includes(v)
    )
  ) {
    return value;
  }
  return defaultVal;
}

/**
 * Validate and coerce raw parsed filter fields into a valid FilterState,
 * falling back to defaults for any field that has an incorrect type.
 */
function coerceFilterState(raw: Record<string, unknown>): FilterState {
  return {
    selectedTags: coerceStringArray(
      raw.selectedTags,
      DEFAULT_FILTER_STATE.selectedTags
    ),
    excludedTags: coerceStringArray(
      raw.excludedTags,
      DEFAULT_FILTER_STATE.excludedTags
    ),
    selectedStatuses: coerceTaskStatuses(
      raw.selectedStatuses,
      DEFAULT_FILTER_STATE.selectedStatuses
    ),
    selectedFiles: coerceStringArray(
      raw.selectedFiles,
      DEFAULT_FILTER_STATE.selectedFiles
    ),
    searchQuery:
      typeof raw.searchQuery === "string"
        ? raw.searchQuery
        : DEFAULT_FILTER_STATE.searchQuery,
    traversalMode: isValidTraversalMode(raw.traversalMode)
      ? raw.traversalMode
      : DEFAULT_FILTER_STATE.traversalMode,
    onlyStarred: coerceBool(raw.onlyStarred, DEFAULT_FILTER_STATE.onlyStarred),
  };
}

export function filterStateFromSource(source: string): ParseResult {
  if (!source.trim()) {
    return {
      kind: "ok",
      filter: { ...DEFAULT_FILTER_STATE },
      config: { ...DEFAULT_EMBED_CONFIG },
    };
  }
  try {
    const parsed = JSON.parse(source) as unknown;
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return { kind: "invalid" };
    }
    const obj = parsed as Record<string, unknown>;
    if ("filter" in obj === false && "config" in obj === false) {
      // JSON parsed but uses the old flat format
      console.warn(
        "[tasks-map] Embed block uses the old flat format. Re-insert it using the command palette to migrate it to the current format."
      );
      return { kind: "legacy" };
    }
    const rawFilter =
      typeof obj.filter === "object" && obj.filter !== null
        ? (obj.filter as Record<string, unknown>)
        : {};
    const rawConfig =
      typeof obj.config === "object" && obj.config !== null
        ? (obj.config as Record<string, unknown>)
        : {};
    return {
      kind: "ok",
      filter: coerceFilterState(rawFilter),
      config: coerceEmbedConfig(rawConfig),
    };
  } catch (err) {
    console.warn("[tasks-map] Failed to parse embed filter config:", err);
    return { kind: "invalid" };
  }
}
