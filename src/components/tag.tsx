import React from "react";

interface TagProps {
  tag: string;
}

function getTagColor(tag: string): string {
  // Simple hash function to generate consistent colors
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Convert hash to HSL color with good contrast
  const hue = Math.abs(hash) % 360;
  const saturation = 65; // Good saturation for readability
  const lightness = 45; // Dark enough for white text

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

export function Tag({ tag }: TagProps) {
  const backgroundColor = getTagColor(tag);

  return (
    <span className="tasks-map-tag" style={{ backgroundColor }}>
      {tag}
    </span>
  );
}
