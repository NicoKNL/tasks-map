const STYLE_ELEMENT_ID = "tasks-map-tag-colors";
const PALETTE_SIZE = 50;
const SATURATION = 65;
const LIGHTNESS = 45;

function generatePaletteCSS(
  mode: "random" | "static",
  seed: number,
  staticColor: string
): string {
  if (mode === "static") {
    const rules: string[] = [];
    for (let i = 0; i < PALETTE_SIZE; i++) {
      rules.push(
        `.tasks-map-tag--color-${i} { background-color: ${staticColor}; }`
      );
    }
    return rules.join("\n");
  }

  const rules: string[] = [];
  const offset = seed % 360;

  for (let i = 0; i < PALETTE_SIZE; i++) {
    const hue = (offset + Math.round((360 / PALETTE_SIZE) * i)) % 360;
    rules.push(
      `.tasks-map-tag--color-${i} { background-color: hsl(${hue}, ${SATURATION}%, ${LIGHTNESS}%); }`
    );
  }

  return rules.join("\n");
}

export function getTagColorClass(tag: string): string {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = (hash * 31 + tag.charCodeAt(i)) % 2147483647;
  }
  const index = Math.abs(hash) % PALETTE_SIZE;
  return `tasks-map-tag--color-${index}`;
}

class TagColorManager {
  private styleEl: HTMLStyleElement | null = null;

  init(mode: "random" | "static", seed: number, staticColor: string): void {
    if (!this.styleEl) {
      // eslint-disable-next-line no-restricted-syntax
      this.styleEl = document.createElement("style");
      this.styleEl.id = STYLE_ELEMENT_ID;
      document.head.appendChild(this.styleEl);
    }
    this.styleEl.textContent = generatePaletteCSS(mode, seed, staticColor);
  }

  update(mode: "random" | "static", seed: number, staticColor: string): void {
    if (!this.styleEl) {
      this.init(mode, seed, staticColor);
      return;
    }
    this.styleEl.textContent = generatePaletteCSS(mode, seed, staticColor);
  }

  destroy(): void {
    this.styleEl?.remove();
    this.styleEl = null;
  }
}

export const tagColorManager = new TagColorManager();
