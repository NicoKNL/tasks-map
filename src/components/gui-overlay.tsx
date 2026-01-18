import MultiSelect from "./multi-select";
import TagSelect from "./tag-select";
import { TaskStatus } from "src/types/task";
import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface GuiOverlayProps {
  allTags: string[];
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void; // eslint-disable-line no-unused-vars
  excludedTags: string[];
  setExcludedTags: (tags: string[]) => void; // eslint-disable-line no-unused-vars
  allFiles: string[];
  selectedFiles: string[];
  setSelectedFiles: (files: string[]) => void; // eslint-disable-line no-unused-vars
  reloadTasks: () => void;
  allStatuses: TaskStatus[];
  selectedStatuses: TaskStatus[];
  setSelectedStatuses: (statuses: TaskStatus[]) => void; // eslint-disable-line no-unused-vars
  showTags?: boolean;
  hideTags?: boolean;
  setHideTags: () => void;
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
    reloadTasks,
    allStatuses,
    selectedStatuses,
    setSelectedStatuses,
    showTags = true,
    hideTags = false,
    setHideTags,
  } = props;

  const [isMinimized, setIsMinimized] = useState(false);

  const handleToggleHideTags = () => {
    setHideTags();
  };

  const toggleMinimized = () => {
    setIsMinimized((prev) => !prev);
  };

  return (
    <div className={`tasks-map-filter-panel ${isMinimized ? "minimized" : ""}`}>
      <button
        className="tasks-map-filter-panel-toggle"
        onClick={toggleMinimized}
        title={isMinimized ? "Expand filters" : "Minimize filters"}
      >
        {isMinimized ? <ChevronLeft size={18} /> : <ChevronRight size={12} />}
      </button>

      {!isMinimized && (
        <>
          <div className="tasks-map-filter-section">
            <div className="tasks-map-filter-item">
              <label className="tasks-map-filter-label">Status</label>
              <MultiSelect
                options={allStatuses}
                selected={selectedStatuses}
                setSelected={setSelectedStatuses}
                placeholder="Filter by status..."
              />
            </div>

            <div className="tasks-map-filter-item">
              <label className="tasks-map-filter-label">Include labels</label>
              <TagSelect
                allTags={allTags}
                selectedTags={selectedTags}
                setSelectedTags={setSelectedTags}
              />
            </div>

            <div className="tasks-map-filter-item">
              <label className="tasks-map-filter-label">Exclude labels</label>
              <TagSelect
                allTags={allTags}
                selectedTags={excludedTags}
                setSelectedTags={setExcludedTags}
              />
            </div>

            <div className="tasks-map-filter-item">
              <label className="tasks-map-filter-label">Files / Folders</label>
              <MultiSelect
                options={allFiles}
                selected={selectedFiles}
                setSelected={setSelectedFiles}
                placeholder="Filter by file or folder..."
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
                    Hide tags on nodes
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Reload Button */}
          <div className="tasks-map-filter-actions">
            <button
              onClick={reloadTasks}
              className="tasks-map-gui-overlay-reload-button"
            >
              Reload tasks
            </button>
          </div>
        </>
      )}
    </div>
  );
}
