import React, { useMemo, useRef, useEffect } from "react";
import { BaseTask, TaskStatus } from "src/types/task";
import { t } from "../i18n";

const statusLabelKeys: Record<TaskStatus, string> = {
  todo: "filters.status_todo",
  in_progress: "filters.status_in_progress",
  done: "filters.status_done",
  canceled: "filters.status_canceled",
};

const ALL_STATUSES: TaskStatus[] = ["todo", "in_progress", "done", "canceled"];

function getContrastColor(bgColor: string): string {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "#000000";
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  // Relative luminance (sRGB)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#000000" : "#ffffff";
}

interface StatusCountsOverlayProps {
  tasks: BaseTask[];
}

export default function StatusCountsOverlay({
  tasks,
}: StatusCountsOverlayProps) {
  const totalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateColor = () => {
      if (totalRef.current) {
        const accent = getComputedStyle(totalRef.current).backgroundColor;
        totalRef.current.style.setProperty(
          "--status-counts-total-color",
          getContrastColor(accent)
        );
      }
    };

    updateColor();

    // Re-compute when Obsidian changes theme/accent (style or class mutations on body)
    const observer = new MutationObserver(updateColor);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["style", "class"],
    });

    return () => observer.disconnect();
  }, []);

  const counts = useMemo(() => {
    const map: Record<TaskStatus, number> = {
      todo: 0,
      in_progress: 0,
      done: 0,
      canceled: 0,
    };
    for (const task of tasks) {
      map[task.status]++;
    }
    return map;
  }, [tasks]);

  return (
    <div className="tasks-map-status-counts-overlay">
      {ALL_STATUSES.map((status) => (
        <div key={status} className="tasks-map-status-counts-item">
          <span
            className={`tasks-map-status-counts-dot tasks-map-status-counts-dot--${status}`}
          />
          <span className="tasks-map-status-counts-label">
            {t(statusLabelKeys[status])}
          </span>
          <span className="tasks-map-status-counts-value">
            {counts[status]}
          </span>
        </div>
      ))}
      <div
        ref={totalRef}
        className="tasks-map-status-counts-item tasks-map-status-counts-total"
      >
        <span className="tasks-map-status-counts-label">
          {t("filters.status_total")}
        </span>
        <span className="tasks-map-status-counts-value">{tasks.length}</span>
      </div>
    </div>
  );
}
