import React, { useState } from "react";
import { X } from "lucide-react";
import { TagColorPalette, getTagColorClass } from "../lib/tag-color-manager";

interface TagProps {
  tag: string;
  palette?: TagColorPalette;
  onRemove?: (tag: string) => void; // eslint-disable-line no-unused-vars
}

export function Tag({ tag, palette = "rainbow", onRemove }: TagProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove?.(tag);
  };

  return (
    <span
      className={`tasks-map-tag ${getTagColorClass(tag, palette)} ${onRemove ? "removable" : ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span>{tag}</span>
      {isHovered && onRemove && (
        <X
          size={12}
          className="tasks-map-tag-remove-icon"
          onClick={handleRemoveClick}
        />
      )}
    </span>
  );
}
