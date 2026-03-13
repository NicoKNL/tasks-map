import MultiSelect from "./multi-select";
import TagSelect from "./tag-select";
import SaveFilterButton from "./save-filter-button";
import { TaskStatus } from "src/types/task";
import React, { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { t } from "../i18n";

interface GuiOverlayProps {
  allTags: string[];
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void; // eslint-disable-line no-unused-vars
  excludedTags: string[];
  setExcludedTags: (tags: string[]) => void; // eslint-disable-line no-unused-vars
  allFiles: string[];
  selectedFiles: string[];
  setSelectedFiles: (files: string[]) => void; // eslint-disable-line no-unused-vars
  createTasks: () => void;
  reloadTasks: () => void;
  allStatuses: TaskStatus[];
  selectedStatuses: TaskStatus[];
  setSelectedStatuses: (statuses: TaskStatus[]) => void; // eslint-disable-line no-unused-vars
  showTags?: boolean;
  hideTags?: boolean;
  setHideTags: () => void;
  layoutDirection?: "Horizontal" | "Vertical";
  showPriorities?: boolean;
  showTagsSetting?: boolean;
  searchPanelOpen?: boolean;
  searchResultsCount?: number;
}

export default function GuiOverlay(props: GuiOverlayProps) {
  const {
    allTags,
    selectedTags,
    setSelectedTags,
    excludedTags,
    setExcludedTags,
    allFiles,
    selectedFiles,
    setSelectedFiles,
    createTasks,
    reloadTasks,
    allStatuses,
    selectedStatuses,
    setSelectedStatuses,
    showTags = true,
    hideTags = false,
    setHideTags,
    layoutDirection,
    showPriorities,
    showTagsSetting,
    searchPanelOpen = false,
    searchResultsCount = 0,
  } = props;

  const [isMinimized, setIsMinimized] = useState(false);

  const handleToggleHideTags = () => {
    setHideTags();
  };

  const toggleMinimized = () => {
    setIsMinimized((prev) => !prev);
  };

  // Calculate dynamic top position based on search panel state
  const dynamicTop = useMemo(() => {
    const baseTop = 16; // Base top position

    if (!searchPanelOpen) {
      // Search panel is minimized (just a button)
      // Button height is approximately 34px (from CSS .tasks-map-search-panel-toggle)
      const minimizedSearchPanelHeight = 34;
      return baseTop + minimizedSearchPanelHeight + 8; // Add spacing
    }

    // Search panel is open, use fixed height
    // Fixed height for search panel (including input, results count, and scrollable results list)
    const searchPanelHeight = 400; // px - fixed height

    // Return top position: search panel height + spacing
    // Add 8px spacing between search panel and filter panel
    return baseTop + searchPanelHeight + 8;
  }, [searchPanelOpen]);

  const panelStyle = useMemo(() => {
    return {
      top: `${dynamicTop}px`,
    };
  }, [dynamicTop]);

  return (
    <div 
      className={`tasks-map-filter-panel ${isMinimized ? "minimized" : ""}`}
      style={panelStyle}
    >
      <button
        className="tasks-map-filter-panel-toggle"
        onClick={toggleMinimized}
        title={
          isMinimized
            ? t("filters.expand_filters")
            : t("filters.minimize_filters")
        }
      >
        {isMinimized ? <ChevronLeft size={18} /> : <ChevronRight size={12} />}
      </button>

      {!isMinimized && (
        <>
          <div className="tasks-map-filter-section">
            <div className="tasks-map-filter-item">
              <label className="tasks-map-filter-label">
                {t("filters.status")}
              </label>
              <MultiSelect
                options={allStatuses}
                selected={selectedStatuses}
                setSelected={setSelectedStatuses}
                placeholder={t("filters.filter_by_status")}
              />
            </div>

            <div className="tasks-map-filter-item">
              <label className="tasks-map-filter-label">
                {t("filters.include_labels")}
              </label>
              <TagSelect
                allTags={allTags}
                selectedTags={selectedTags}
                setSelectedTags={setSelectedTags}
              />
            </div>

            <div className="tasks-map-filter-item">
              <label className="tasks-map-filter-label">
                {t("filters.exclude_labels")}
              </label>
              <TagSelect
                allTags={allTags}
                selectedTags={excludedTags}
                setSelectedTags={setExcludedTags}
              />
            </div>

            <div className="tasks-map-filter-item">
              <label className="tasks-map-filter-label">
                {t("filters.files_folders")}
              </label>
              <MultiSelect
                options={allFiles}
                selected={selectedFiles}
                setSelected={setSelectedFiles}
                placeholder={t("filters.filter_by_file")}
              />
            </div>

            {showTags && (
              <div className="tasks-map-filter-item">
                <label className="tasks-map-gui-overlay-checkbox-label">
                  <input
                    type="checkbox"
                    checked={hideTags}
                    onChange={handleToggleHideTags}
                    className="tasks-map-gui-overlay-checkbox-input"
                  />
                  <span className="tasks-map-gui-overlay-checkbox-text">
                    {t("filters.hide_tags_on_nodes")}
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Create Button */}
          <div className="tasks-map-filter-actions">
            <button
              onClick={createTasks}
              className="tasks-map-gui-overlay-reload-button"
            >
              {t("filters.create_tasks")}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="tasks-map-filter-actions">
            <button
              onClick={reloadTasks}
              className="tasks-map-gui-overlay-reload-button"
            >
              {t("filters.reload_tasks")}
            </button>
            <SaveFilterButton
              selectedTags={selectedTags}
              excludedTags={excludedTags}
              selectedStatuses={selectedStatuses}
              selectedFiles={selectedFiles}
              hideTags={hideTags}
              layoutDirection={layoutDirection}
              showPriorities={showPriorities}
              showTags={showTagsSetting}
            />
          </div>
        </>
      )}
    </div>
  );
}
