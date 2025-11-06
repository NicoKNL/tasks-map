import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { getTagColor } from "../lib/utils";

interface TagProps {
  tag: string;
  tagColorMode?: "random" | "static";
  tagColorSeed?: number;
  tagStaticColor?: string;
  onRemove?: (tag: string) => void; // eslint-disable-line no-unused-vars
}

export function Tag({
  tag,
  tagColorMode = "random",
  tagColorSeed = 42,
  tagStaticColor = "#3B82F6",
  onRemove,
}: TagProps) {
  const [isHovered, setIsHovered] = useState(false);

  const backgroundColor = getTagColor(
    tag,
    tagColorMode,
    tagColorSeed,
    tagStaticColor
  );

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove?.(tag);
  };

  // Create a style element for dynamic color if it doesn't exist
  useEffect(() => {
    const tagHash = tag.replace(/[^a-zA-Z0-9]/g, "");
    const className = `tag-${tagHash}`;

    if (!document.querySelector(`style[data-tag="${tagHash}"]`)) {
      const style = document.createElement("style");
      style.setAttribute("data-tag", tagHash);
      style.textContent = `.${className} { background-color: ${backgroundColor} !important; }`;
      document.head.appendChild(style);
    }
  }, [tag, backgroundColor]);

  const tagHash = tag.replace(/[^a-zA-Z0-9]/g, "");
  const dynamicClassName = `tag-${tagHash}`;

  return (
    <span
      className={`tasks-map-tag ${dynamicClassName} ${onRemove ? "removable" : ""}`}
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
