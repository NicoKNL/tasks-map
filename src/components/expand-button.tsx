import React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ExpandButtonProps {
  expanded: boolean;
  onClick: (e: React.MouseEvent) => void; // eslint-disable-line no-unused-vars
}

export function ExpandButton({ expanded, onClick }: ExpandButtonProps) {
  return (
    <button
      onClick={onClick}
      title={expanded ? "Collapse debug info" : "Expand debug info"}
      className="tasks-map-expand-button"
    >
      {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
    </button>
  );
}
