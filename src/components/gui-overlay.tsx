import MultiSelect from "./multi-select";
import TagSelect from "./tag-select";
import { TaskStatus, BaseTask } from "src/types/task";
import { FilterState } from "src/types/filter-state";
import type { TraversalMode } from "src/lib/traverse-graph";
import React, { useState, useMemo, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp, Search, X } from "lucide-react";
import { t } from "../i18n";

interface GuiOverlayProps {
  allTags: string[];
  filterState: FilterState;
  setFilterState: React.Dispatch<React.SetStateAction<FilterState>>;
  allFiles: string[];
  reloadTasks: () => void;
  allStatuses: TaskStatus[];
  showTags?: boolean;
  hideTags?: boolean;
  setHideTags: () => void;
  onSearch: (_query: string) => void;
  searchResultCount: number | null;
  suggestionTasks: BaseTask[];
}

export default function GuiOverlay(props: GuiOverlayProps) {
  const {
    allTags,
    filterState,
    setFilterState,
    allFiles,
    reloadTasks,
    allStatuses,
    showTags = true,
    hideTags = false,
    setHideTags,
    onSearch,
    searchResultCount,
    suggestionTasks,
  } = props;

  const showDependencies =
    filterState.traversalMode === "upstream" ||
    filterState.traversalMode === "both";
  const showDependents =
    filterState.traversalMode === "downstream" ||
    filterState.traversalMode === "both";

  const toggleTraversal = (
    upstream: boolean,
    downstream: boolean
  ): TraversalMode => {
    if (upstream && downstream) return "both";
    if (upstream) return "upstream";
    if (downstream) return "downstream";
    return "match";
  };

  const [isMinimized, setIsMinimized] = useState(false);
  const [searchQuery, setSearchQuery] = useState(filterState.searchQuery);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    setSearchQuery(filterState.searchQuery);
  }, [filterState.searchQuery]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const lowerQuery = searchQuery.toLowerCase();
    return suggestionTasks
      .filter(
        (task) =>
          task.summary.toLowerCase().includes(lowerQuery) ||
          task.id.toLowerCase().includes(lowerQuery) ||
          task.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
      )
      .slice(0, 8);
  }, [searchQuery, suggestionTasks]);

  useEffect(() => {
    setSelectedSuggestion(-1);
  }, [suggestions]);

  const handleToggleHideTags = () => {
    setHideTags();
  };

  const toggleMinimized = () => {
    setIsMinimized((prev) => !prev);
  };

  const submitSearch = () => {
    setShowSuggestions(false);
    if (!searchQuery.trim()) {
      clearSearch();
    } else {
      onSearch(searchQuery);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedSuggestion((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedSuggestion((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter") {
      if (selectedSuggestion >= 0 && suggestions[selectedSuggestion]) {
        const task = suggestions[selectedSuggestion];
        setSearchQuery(task.id);
        setShowSuggestions(false);
        onSearch(task.id);
      } else {
        submitSearch();
      }
    } else if (e.key === "Escape") {
      if (showSuggestions) {
        setShowSuggestions(false);
      } else {
        clearSearch();
      }
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setShowSuggestions(true);
  };

  const handleSelectSuggestion = (task: BaseTask) => {
    setSearchQuery(task.id);
    setShowSuggestions(false);
    onSearch(task.id);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setShowSuggestions(false);
    onSearch("");
  };

  return (
    <div className={`tasks-map-filter-panel ${isMinimized ? "minimized" : ""}`}>
      <div className="tasks-map-filter-panel__header">
        <span className="tasks-map-filter-panel__title">
          {t("filters.title")}
        </span>
        <button
          className="tasks-map-filter-panel__header-icon"
          onClick={toggleMinimized}
          aria-label={
            isMinimized
              ? t("filters.expand_filters")
              : t("filters.minimize_filters")
          }
          title={
            isMinimized
              ? t("filters.expand_filters")
              : t("filters.minimize_filters")
          }
        >
          {isMinimized ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
      </div>

      {!isMinimized && (
        <>
          <div className="tasks-map-filter-panel__content">
            <div className="tasks-map-search-bar">
              <div className="tasks-map-search-bar-row">
                <button
                  className="tasks-map-search-icon-button"
                  onClick={submitSearch}
                  title={t("search.placeholder")}
                >
                  <Search size={14} />
                </button>
                <input
                  ref={inputRef}
                  type="text"
                  className="tasks-map-search-input"
                  placeholder={t("search.placeholder")}
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onKeyDown={handleSearchKeyDown}
                  onFocus={() => searchQuery.trim() && setShowSuggestions(true)}
                  onBlur={() =>
                    setTimeout(() => {
                      setShowSuggestions(false);
                    }, 150)
                  }
                />
                {searchQuery && (
                  <button
                    className="tasks-map-search-clear"
                    onClick={clearSearch}
                    title={t("search.clear")}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              {searchResultCount !== null && (
                <span className="tasks-map-search-result-count">
                  {searchResultCount > 0
                    ? t("search.results_count", { count: searchResultCount })
                    : t("search.no_results")}
                </span>
              )}
              {searchResultCount !== null && (
                <div className="tasks-map-traversal-options">
                  <label className="tasks-map-gui-overlay-checkbox-label">
                    <input
                      type="checkbox"
                      checked={showDependencies}
                      onChange={(e) =>
                        setFilterState((prev) => ({
                          ...prev,
                          traversalMode: toggleTraversal(
                            e.target.checked,
                            showDependents
                          ),
                        }))
                      }
                      className="tasks-map-gui-overlay-checkbox-input"
                    />
                    <span className="tasks-map-gui-overlay-checkbox-text">
                      {t("search.show_dependencies")}
                    </span>
                  </label>
                  <label className="tasks-map-gui-overlay-checkbox-label">
                    <input
                      type="checkbox"
                      checked={showDependents}
                      onChange={(e) =>
                        setFilterState((prev) => ({
                          ...prev,
                          traversalMode: toggleTraversal(
                            showDependencies,
                            e.target.checked
                          ),
                        }))
                      }
                      className="tasks-map-gui-overlay-checkbox-input"
                    />
                    <span className="tasks-map-gui-overlay-checkbox-text">
                      {t("search.show_dependents")}
                    </span>
                  </label>
                </div>
              )}
              {showSuggestions && suggestions.length > 0 && (
                <div
                  className="tasks-map-search-suggestions"
                  ref={suggestionsRef}
                >
                  {suggestions.map((task, index) => (
                    <div
                      key={task.id}
                      className={`tasks-map-search-suggestion ${
                        index === selectedSuggestion
                          ? "tasks-map-search-suggestion--active"
                          : ""
                      }`}
                      onMouseDown={() => handleSelectSuggestion(task)}
                    >
                      <span className="tasks-map-search-suggestion-summary">
                        {task.summary}
                      </span>
                      {task.tags.length > 0 && (
                        <span className="tasks-map-search-suggestion-tags">
                          {task.tags.slice(0, 3).join(", ")}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="tasks-map-filter-section">
              <div className="tasks-map-filter-item">
                <label className="tasks-map-filter-label">
                  {t("filters.status")}
                </label>
                <MultiSelect
                  options={allStatuses}
                  selected={filterState.selectedStatuses}
                  setSelected={(statuses) =>
                    setFilterState((prev) => ({
                      ...prev,
                      selectedStatuses: statuses,
                    }))
                  }
                  placeholder={t("filters.filter_by_status")}
                />
              </div>

              <div className="tasks-map-filter-item">
                <label className="tasks-map-filter-label">
                  {t("filters.include_labels")}
                </label>
                <TagSelect
                  allTags={allTags}
                  selectedTags={filterState.selectedTags}
                  setSelectedTags={(tags) =>
                    setFilterState((prev) => ({ ...prev, selectedTags: tags }))
                  }
                />
              </div>

              <div className="tasks-map-filter-item">
                <label className="tasks-map-filter-label">
                  {t("filters.exclude_labels")}
                </label>
                <TagSelect
                  allTags={allTags}
                  selectedTags={filterState.excludedTags}
                  setSelectedTags={(tags) =>
                    setFilterState((prev) => ({ ...prev, excludedTags: tags }))
                  }
                />
              </div>

              <div className="tasks-map-filter-item">
                <label className="tasks-map-filter-label">
                  {t("filters.files_folders")}
                </label>
                <MultiSelect
                  options={allFiles}
                  selected={filterState.selectedFiles}
                  setSelected={(files) =>
                    setFilterState((prev) => ({
                      ...prev,
                      selectedFiles: files,
                    }))
                  }
                  placeholder={t("filters.filter_by_file")}
                />
              </div>

              <div className="tasks-map-filter-item">
                <label className="tasks-map-gui-overlay-checkbox-label">
                  <input
                    type="checkbox"
                    checked={filterState.onlyStarred}
                    onChange={(e) =>
                      setFilterState((prev) => ({
                        ...prev,
                        onlyStarred: e.target.checked,
                      }))
                    }
                    className="tasks-map-gui-overlay-checkbox-input"
                  />
                  <span className="tasks-map-gui-overlay-checkbox-text">
                    {t("filters.only_starred")}
                  </span>
                </label>
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

            {/* Reload Button */}
            <div className="tasks-map-filter-actions">
              <button
                onClick={reloadTasks}
                className="tasks-map-gui-overlay-reload-button"
              >
                {t("filters.reload_tasks")}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
