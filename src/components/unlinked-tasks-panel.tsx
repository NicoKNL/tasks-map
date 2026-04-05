import React, { useState, useMemo, useCallback } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { BaseTask } from "src/types/task";
import { t } from "../i18n";

// Namespaced dataTransfer key used on both ends of the drag-and-drop.
// Using a specific MIME-type-style string (rather than "text/plain") ensures
// the graph drop handler ignores unrelated drags (OS files, text selections,
// etc.) by checking whether getData() returns a non-empty value.
const DRAG_DATA_KEY = "application/tasks-map-unlinked-task-id";

export { DRAG_DATA_KEY };

interface UnlinkedTasksPanelProps {
  tasks: BaseTask[];
}

export default function UnlinkedTasksPanel({ tasks }: UnlinkedTasksPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [filterQuery, setFilterQuery] = useState("");

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const clearFilter = useCallback(() => {
    setFilterQuery("");
  }, []);

  const filteredTasks = useMemo(() => {
    if (!filterQuery.trim()) return tasks;
    const lower = filterQuery.toLowerCase();
    return tasks.filter(
      (task) =>
        task.summary.toLowerCase().includes(lower) ||
        task.tags.some((tag) => tag.toLowerCase().includes(lower))
    );
  }, [tasks, filterQuery]);

  const handleDragStart = useCallback(
    (event: React.DragEvent<HTMLDivElement>, task: BaseTask) => {
      event.dataTransfer.setData(DRAG_DATA_KEY, task.id);
      event.dataTransfer.effectAllowed = "move";
    },
    []
  );

  return (
    <div
      className={`tasks-map-unlinked-panel${isCollapsed ? " tasks-map-unlinked-panel--collapsed" : ""}`}
    >
      <div className="tasks-map-unlinked-panel__header">
        <span className="tasks-map-unlinked-panel__title">
          {t("unlinked_panel.title")}
          {isCollapsed && tasks.length > 0 && (
            <span className="tasks-map-unlinked-panel__count">
              {" "}
              ({tasks.length})
            </span>
          )}
        </span>
        <button
          className="tasks-map-unlinked-panel__header-icon"
          onClick={toggleCollapsed}
          aria-label={
            isCollapsed
              ? t("unlinked_panel.expand")
              : t("unlinked_panel.collapse")
          }
          title={
            isCollapsed
              ? t("unlinked_panel.expand")
              : t("unlinked_panel.collapse")
          }
        >
          {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
      </div>

      {!isCollapsed && (
        <>
          <div className="tasks-map-unlinked-panel__filter-row">
            <input
              type="text"
              className="tasks-map-unlinked-panel__filter-input"
              placeholder={t("unlinked_panel.filter_placeholder")}
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
            />
            {filterQuery && (
              <button
                className="tasks-map-unlinked-panel__filter-clear"
                onClick={clearFilter}
                aria-label={t("search.clear")}
                title={t("search.clear")}
              >
                <X size={12} />
              </button>
            )}
          </div>

          <div className="tasks-map-unlinked-panel__list">
            {filteredTasks.length === 0 ? (
              <div className="tasks-map-unlinked-panel__empty">
                {t("unlinked_panel.empty")}
              </div>
            ) : (
              filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className="tasks-map-unlinked-panel__item"
                  draggable
                  onDragStart={(e) => handleDragStart(e, task)}
                  title={t("unlinked_panel.drag_hint")}
                >
                  <span className="tasks-map-unlinked-panel__item-summary">
                    {task.summary || task.text}
                  </span>
                  {task.tags.length > 0 && (
                    <span className="tasks-map-unlinked-panel__item-tags">
                      {task.tags.slice(0, 3).join(", ")}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
