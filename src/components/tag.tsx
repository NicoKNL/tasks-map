import React from "react";

interface TagProps {
  tag: string;
  tagColorMode?: "random" | "static";
  tagColorSeed?: number;
  tagStaticColor?: string;
}

function getTagColor(
  tag: string,
  mode = "random",
  seed = 42,
  staticColor = "#3B82F6"
): string {
  if (mode === "static") {
    return staticColor;
  }

  // Use seed for consistent random colors
  let hash = seed;
  for (let i = 0; i < tag.length; i++) {
    hash = (hash * 31 + tag.charCodeAt(i)) % 2147483647;
  }

  // Convert hash to HSL color with good contrast
  const hue = hash % 360;
  const saturation = 65; // Good saturation for readability
  const lightness = 45; // Dark enough for white text

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

export function Tag({
  tag,
  tagColorMode = "random",
  tagColorSeed = 42,
  tagStaticColor = "#3B82F6",
}: TagProps) {
  const backgroundColor = getTagColor(
    tag,
    tagColorMode,
    tagColorSeed,
    tagStaticColor
  );

  return (
    <span className="tasks-map-tag" style={{ backgroundColor }}>
      {tag}
    </span>
  );
}
