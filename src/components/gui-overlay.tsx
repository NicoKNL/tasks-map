import MultiSelect from "./multi-select";
import TagSelect from "./tag-select";
import { TaskStatus } from "src/types/task";
import React from "react";

interface GuiOverlayProps {
  allTags: string[];
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void; // eslint-disable-line no-unused-vars
  reloadTasks: () => void;
  allStatuses: TaskStatus[];
  selectedStatuses: TaskStatus[];
  setSelectedStatuses: (statuses: TaskStatus[]) => void; // eslint-disable-line no-unused-vars
  showTags?: boolean;
  hideTags?: boolean;
  setHideTags: () => void; // eslint-disable-line no-unused-vars
}

export default function GuiOverlay(props: GuiOverlayProps) {
  const {
    allTags,
    selectedTags,
    setSelectedTags,
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
    <>
      {showTags && (
        <div className="tasks-map-gui-overlay-hidetag-checkbox">
          <label className="tasks-map-gui-overlay-checkbox-label">
            <input
              type="checkbox"
              checked={hideTags}
              onChange={handleToggleHideTags}
              className="tasks-map-gui-overlay-checkbox-input"
            />
            <span className="tasks-map-gui-overlay-checkbox-text">
              Hide tags
            </span>
          </label>
        </div>
      )}
      <div className="tasks-map-gui-overlay-tag-select">
        <TagSelect
          allTags={allTags}
          selectedTags={selectedTags}
          setSelectedTags={setSelectedTags}
        />
      </div>
      <div className="tasks-map-gui-overlay-status-select">
        <MultiSelect
          options={allStatuses}
          selected={selectedStatuses}
          setSelected={setSelectedStatuses}
          placeholder="Filter by status..."
        />
      </div>
      <div className="tasks-map-gui-overlay-bottom">
        <button
          onClick={reloadTasks}
          className="tasks-map-gui-overlay-reload-button"
        >
          Reload tasks
        </button>
      </div>
    </>
  );
}
