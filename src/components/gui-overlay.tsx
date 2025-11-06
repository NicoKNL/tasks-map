import MultiSelect from "./multi-select";
import TagSelect from "./tag-select";
import { TaskStatus } from "src/types/task";

interface GuiOverlayProps {
  allTags: string[];
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void; // eslint-disable-line no-unused-vars
  reloadTasks: () => void;
  allStatuses: TaskStatus[];
  selectedStatuses: TaskStatus[];
  setSelectedStatuses: (statuses: TaskStatus[]) => void; // eslint-disable-line no-unused-vars
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
  } = props;

  return (
    <>
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
