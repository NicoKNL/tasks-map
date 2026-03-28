import React from "react";
import { BaseTask } from "src/types/base-task";
import { extractDateFromTaskText } from "../lib/utils";

// Date type configuration
const DATE_TYPES = [
  { key: "due", emoji: "📅", label: "Due" },
  { key: "scheduled", emoji: "⏳", label: "Sche" },
  { key: "start", emoji: "🛫", label: "Start" },
  { key: "done", emoji: "✅", label: "Done" },
  { key: "canceled", emoji: "❌", label: "Cancell" },
  { key: "created", emoji: "➕", label: "Create" },
] as const;

interface DateTooltipProps {
  task: BaseTask;
  maxWidth?: number;
  spacing?: number;
  fontSize?: number;
  capsulePadding?: number;
  lineHeight?: number;
}

export default function DateTooltip({
  task,
  maxWidth = 250, // Default to node width
  spacing = 6, // Space between capsules
  fontSize = 11,
  capsulePadding = 4,
  lineHeight = 1.5,
}: DateTooltipProps) {
  // Extract all dates from task text
  const dateItems = DATE_TYPES
    .map(({ key, emoji, label }) => {
      const dateStr = extractDateFromTaskText(task.text, key);
      if (!dateStr) return null;
      
      // Format date to YYYY-MM-DD
      let formattedDate = dateStr;
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        // Already in YYYY-MM-DD format, keep as is
        formattedDate = dateStr;
      } else if (/^\d{8}$/.test(dateStr)) {
        // Convert from YYYYMMDD to YYYY-MM-DD
        formattedDate = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
      } else if (dateStr.toLowerCase() === 'today') {
        const today = new Date();
        formattedDate = today.getFullYear() + '-' +
          String(today.getMonth() + 1).padStart(2, '0') + '-' +
          String(today.getDate()).padStart(2, '0');
      } else if (dateStr.toLowerCase() === 'tomorrow') {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        formattedDate = tomorrow.getFullYear() + '-' +
          String(tomorrow.getMonth() + 1).padStart(2, '0') + '-' +
          String(tomorrow.getDate()).padStart(2, '0');
      } else if (dateStr.toLowerCase() === 'yesterday') {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        formattedDate = yesterday.getFullYear() + '-' +
          String(yesterday.getMonth() + 1).padStart(2, '0') + '-' +
          String(yesterday.getDate()).padStart(2, '0');
      }
      
      return {
        key,
        emoji,
        label,
        date: formattedDate,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  // If no dates, don't render tooltip
  if (dateItems.length === 0) {
    return null;
  }

  // Layout is vertical stack of capsules

  return (
    <div className="tasks-map-date-tooltip">
      {dateItems.map((item) => (
        <div
          key={item.key}
          className="tasks-map-date-tooltip-capsule"
          style={{
            fontSize: `${fontSize}px`,
            padding: `${capsulePadding}px ${capsulePadding * 2}px`,
            marginBottom: spacing,
            lineHeight: `${lineHeight}`,
          }}
        >
          <span className="tasks-map-date-tooltip-icon">{item.emoji}</span>
          <span className="tasks-map-date-tooltip-label">{item.label}:</span>
          <span className="tasks-map-date-tooltip-value">{item.date}</span>
        </div>
      ))}
    </div>
  );
}
