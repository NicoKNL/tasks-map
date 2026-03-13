import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Search,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { t } from "../i18n";
import { BaseTask } from "../types/task";

interface SearchPanelProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: BaseTask[];
  onJumpToNode: (taskId: string) => void;
  onSearchClick: () => void;
  onSearchResultsChange?: (resultCount: number) => void;
}

export default function SearchPanel({
  isOpen,
  onClose,
  tasks,
  onJumpToNode,
  onSearchClick,
  onSearchResultsChange,
}: SearchPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<BaseTask[]>([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input when panel opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Handle search when query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setCurrentResultIndex(0);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results = tasks.filter(
      (task) =>
        task.text.toLowerCase().includes(query) ||
        task.tags.some((tag) => tag.toLowerCase().includes(query))
    );

    setSearchResults(results);
    setCurrentResultIndex(results.length > 0 ? 0 : -1);
  }, [searchQuery, tasks]);

  // Notify parent about search results count changes
  useEffect(() => {
    if (onSearchResultsChange) {
      onSearchResultsChange(searchResults.length);
    }
  }, [searchResults, onSearchResultsChange]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      // Close on Escape
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }

      // Navigate results with Ctrl+Up/Down
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
          e.preventDefault();
          handlePreviousResult();
        } else if (e.key === "ArrowDown" || e.key === "ArrowRight") {
          e.preventDefault();
          handleNextResult();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, searchResults, currentResultIndex]);

  const handlePreviousResult = () => {
    if (searchResults.length === 0) return;
    const newIndex =
      currentResultIndex <= 0
        ? searchResults.length - 1
        : currentResultIndex - 1;
    setCurrentResultIndex(newIndex);
    onJumpToNode(searchResults[newIndex].id);
  };

  const handleNextResult = () => {
    if (searchResults.length === 0) return;
    const newIndex =
      currentResultIndex >= searchResults.length - 1
        ? 0
        : currentResultIndex + 1;
    setCurrentResultIndex(newIndex);
    onJumpToNode(searchResults[newIndex].id);
  };

  const handleResultClick = (taskId: string) => {
    onJumpToNode(taskId);
  };

  // Calculate panel position
  const panelStyle = useMemo(() => {
    // Base position for search panel
    const baseTop = 16; // 16px from top
    
    if (!isOpen) {
      // Minimized search button should be at the top right
      return { top: `${baseTop}px` };
    }
    
    // Expanded panel at top right
    return { top: `${baseTop}px` };
  }, [isOpen]);

  // If panel is not open, show only the expand button
  if (!isOpen) {
    return (
      <div 
        className="tasks-map-search-panel tasks-map-search-panel-minimized"
        style={panelStyle}
      >
        <button
          className="tasks-map-search-panel-toggle"
          onClick={onSearchClick}
          title={t("search_panel.expand")}
        >
          <Search size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="tasks-map-search-panel" style={panelStyle}>
      <div className="tasks-map-search-panel-content">
        <div className="tasks-map-search-input-header"></div>
        <button
          className="tasks-map-search-panel-close"
          onClick={onClose}
          title={t("search_panel.minimize")}
        >
          <ChevronRight size={12} />
        </button>
        <div className="tasks-map-search-input-container">
          <input
            ref={searchInputRef}
            type="text"
            className="tasks-map-search-input"
            placeholder={t("search_panel.search_placeholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="tasks-map-search-clear-button"
              onClick={() => setSearchQuery("")}
              title={t("search_panel.clear")}
            >
              <X size={12} />
            </button>
          )}
        </div>
        {searchQuery && (
          <div className="tasks-map-search-results-row">
            <div className="tasks-map-search-results-count">
              {searchResults.length === 0
                ? t("search_panel.no_results")
                : searchResults.length +
                  (searchResults.length === 1
                    ? " " + t("search_panel.result")
                    : " " + t("search_panel.results"))}
            </div>

            {searchResults.length > 0 && (
              <div className="tasks-map-search-navigation">
                <button
                  className="tasks-map-search-nav-button"
                  onClick={handlePreviousResult}
                  title={t("search_panel.previous_result")}
                >
                  <ChevronLeft size={12} />
                </button>
                <div className="tasks-map-search-current-index">
                  {currentResultIndex + 1} / {searchResults.length}
                </div>
                <button
                  className="tasks-map-search-nav-button"
                  onClick={handleNextResult}
                  title={t("search_panel.next_result")}
                >
                  <ChevronRight size={12} />
                </button>
              </div>
            )}
          </div>
        )}

        {searchResults.length > 0 && (
          <div className="tasks-map-search-results-list">
            {searchResults.map((task, index) => (
              <div
                key={task.id}
                className={`tasks-map-search-result-item ${
                  index === currentResultIndex
                    ? "tasks-map-search-result-active"
                    : ""
                }`}
                onClick={() => {
                  setCurrentResultIndex(index);
                  handleResultClick(task.id);
                }}
              >
                <div className="tasks-map-search-result-text">{task.text}</div>
                {task.tags.length > 0 && (
                  <div className="tasks-map-search-result-tags">
                    {task.tags.map((tag) => (
                      <span key={tag} className="tasks-map-search-result-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}