import React from "react";
import { t } from "../i18n";

export type GraphEmptyStateVariant = "no_tasks" | "all_unlinked";

interface GraphEmptyStateProps {
  variant: GraphEmptyStateVariant;
}

export function GraphEmptyState({ variant }: GraphEmptyStateProps) {
  const message =
    variant === "no_tasks"
      ? t("graph.no_tasks_hint")
      : t("graph.all_unlinked_hint");

  return (
    <div className="tasks-map-graph-empty-state">
      <p className="tasks-map-graph-empty-state__message">{message}</p>
    </div>
  );
}
