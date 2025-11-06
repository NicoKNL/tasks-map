import { getTagColor } from "../lib/utils";

interface TagProps {
  tag: string;
  tagColorMode?: "random" | "static";
  tagColorSeed?: number;
  tagStaticColor?: string;
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
