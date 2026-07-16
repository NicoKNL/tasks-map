export type TagColorPalette =
  "rainbow" | "ocean" | "forest" | "sunset" | "mono";

export const TAG_COLOR_PALETTES: Record<TagColorPalette, string[]> = {
  rainbow: [
    "#e05c5c", // red
    "#e07c3a", // orange
    "#c9a827", // yellow
    "#4caf62", // green
    "#2674b5", // blue
    "#7c5cbf", // purple
    "#d45fa0", // pink
    "#3ab8b8", // teal
  ],
  ocean: [
    "#1a6e8a",
    "#2187a8",
    "#1f9eb5",
    "#2ab5c4",
    "#3abfaa",
    "#2e9e8c",
    "#1d7e7e",
    "#256e9e",
  ],
  forest: [
    "#2d7a3a",
    "#3a8c45",
    "#4a9e50",
    "#6aaa45",
    "#8ab035",
    "#7a9e2d",
    "#5c8c38",
    "#3d6b2d",
  ],
  sunset: [
    "#c0392b",
    "#d45a2a",
    "#e07030",
    "#e09030",
    "#c97040",
    "#b84060",
    "#a03070",
    "#d04080",
  ],
  mono: [
    "#2674b5",
    "#2674b5",
    "#2674b5",
    "#2674b5",
    "#2674b5",
    "#2674b5",
    "#2674b5",
    "#2674b5",
  ],
};

export const PALETTE_SIZE = 8;

export function getTagColorClass(
  tag: string,
  palette: TagColorPalette = "rainbow"
): string {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = (hash * 31 + tag.charCodeAt(i)) % 2147483647;
  }
  const index = Math.abs(hash) % PALETTE_SIZE;
  return `tasks-map-tag--${palette}-${index}`;
}
