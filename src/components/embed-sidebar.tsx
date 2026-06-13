import React from "react";
import { RefreshCw } from "lucide-react";
import { t } from "../i18n";

interface EmbedSidebarProps {
  onReload: () => void;
}

export function EmbedSidebar({ onReload }: EmbedSidebarProps) {
  return (
    <div className="tasks-map-embed-sidebar">
      <button
        className="tasks-map-embed-sidebar__button"
        onClick={onReload}
        aria-label={t("filters.reload_tasks")}
        title={t("filters.reload_tasks")}
      >
        <RefreshCw size={14} />
      </button>
    </div>
  );
}
