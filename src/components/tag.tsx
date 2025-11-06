import { useState } from "react";
import { X } from "lucide-react";
import { getTagColor } from "../lib/utils";

interface TagProps {
  tag: string;
  tagColorMode?: "random" | "static";
  tagColorSeed?: number;
  tagStaticColor?: string;
  onRemove?: (tag: string) => void;
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

  return (
    <span
      className="tasks-map-tag"
      style={{
        backgroundColor,
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        cursor: onRemove ? "pointer" : "default",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span>{tag}</span>
      {isHovered && onRemove && (
        <X size={12} style={{ color: "white" }} onClick={handleRemoveClick} />
      )}
    </span>
  );
}
