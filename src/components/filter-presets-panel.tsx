import React, { useState, useCallback } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { FilterPreset } from "src/types/settings";
import { FilterState } from "src/types/filter-state";
import FilterPresetBar from "./filter-preset-bar";
import TasksMapPlugin from "../main";
import { t } from "../i18n";

interface FilterPresetsPanelProps {
  presets: FilterPreset[];
  filterState: FilterState;
  plugin: TasksMapPlugin;
  onApply: (_filter: FilterState) => void;
  onSave: (_name: string, _filter: FilterState) => Promise<void>;
  onRename: (_id: string, _name: string) => Promise<void>;
  onDelete: (_id: string) => Promise<void>;
}

export default function FilterPresetsPanel({
  presets,
  filterState,
  plugin,
  onApply,
  onSave,
  onRename,
  onDelete,
}: FilterPresetsPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  return (
    <div
      className={`tasks-map-presets-panel${isCollapsed ? " tasks-map-presets-panel--collapsed" : ""}`}
    >
      <div className="tasks-map-presets-panel__header">
        <span className="tasks-map-presets-panel__title">
          {t("presets.panel_title")}
        </span>
        <button
          className="tasks-map-presets-panel__header-icon"
          onClick={toggleCollapsed}
          aria-label={
            isCollapsed
              ? t("presets.expand_panel")
              : t("presets.collapse_panel")
          }
          title={
            isCollapsed
              ? t("presets.expand_panel")
              : t("presets.collapse_panel")
          }
        >
          {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
      </div>

      {!isCollapsed && (
        <div className="tasks-map-presets-panel__content">
          <FilterPresetBar
            presets={presets}
            filterState={filterState}
            plugin={plugin}
            onApply={onApply}
            onSave={onSave}
            onRename={onRename}
            onDelete={onDelete}
          />
        </div>
      )}
    </div>
  );
}
