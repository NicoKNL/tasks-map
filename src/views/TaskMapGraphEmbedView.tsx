import React, { useState, useEffect, useRef } from "react";
import { ReactFlowProvider } from "reactflow";
import { AppContext } from "src/contexts/context";
import TaskMapGraphView from "./TaskMapGraphView";
import TasksMapPlugin from "../main";
import { TasksMapSettings } from "src/types/settings";
import { FilterState, DEFAULT_FILTER_STATE } from "src/types/filter-state";
import { EmbedConfig, DEFAULT_EMBED_CONFIG } from "src/types/embed-config";

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
    <div className="tasks-map-embed-error">
      <span className="tasks-map-embed-error__icon">⚠️</span>
      <span className="tasks-map-embed-error__message">{message}</span>
    </div>
  );
}

export function filterStateFromSource(source: string): ParsedEmbed | null {
  if (!source.trim()) {
    return {
      filter: { ...DEFAULT_FILTER_STATE },
      config: { ...DEFAULT_EMBED_CONFIG },
    };
  }
  try {
    const parsed = JSON.parse(source) as {
      filter?: Partial<FilterState>;
      config?: Partial<EmbedConfig>;
    };
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      ("filter" in parsed === false && "config" in parsed === false)
    ) {
      console.warn(
        "[tasks-map] Embed block uses the old flat format. Re-insert it using the command palette to migrate it to the current format."
      );
      return null;
    }
    return {
      filter: { ...DEFAULT_FILTER_STATE, ...(parsed.filter ?? {}) },
      config: { ...DEFAULT_EMBED_CONFIG, ...(parsed.config ?? {}) },
    };
  } catch (err) {
    console.warn("[tasks-map] Failed to parse embed filter config:", err);
    return null;
  }
}
