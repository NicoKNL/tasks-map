import MultiSelect from "./multi-select";
import TagSelect from "./tag-select";
import { TaskStatus } from "src/types/task";
import React from "react";

interface GuiOverlayProps {
  allTags: string[];
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void; // eslint-disable-line no-unused-vars
  excludedTags: string[];
  setExcludedTags: (tags: string[]) => void; // eslint-disable-line no-unused-vars
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
    reloadTasks,
    allStatuses,
    selectedStatuses,
    setSelectedStatuses,
    showTags = true,
    hideTags = false,
    setHideTags,
  } = props;

  const handleToggleHideTags = () => {
    setHideTags();
  };

  return (
    <div className="tasks-map-filter-panel">
      <div className="tasks-map-filter-panel-content">
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
      </div>
    </div>
  );
}
