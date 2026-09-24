/**
 * Shared regex patterns for task parsing and manipulation
 */

// ID patterns - for matching and capturing IDs (no 'g' flag for .match())
export const EMOJI_ID_PATTERN = /🆔\s*([a-zA-Z0-9_-]+)/i;
export const DATAVIEW_BRACKET_ID_PATTERN = /\[id::\s*([a-zA-Z0-9_-]+)\]/i;
export const DATAVIEW_PARENTHESES_ID_PATTERN = /\(id::\s*([a-zA-Z0-9_-]+)\)/i;

// ID patterns for removal/global replacement (with 'g' flag)
export const EMOJI_ID_PATTERN_GLOBAL = /🆔\s*[a-zA-Z0-9_-]+/gi;
export const DATAVIEW_BRACKET_ID_PATTERN_GLOBAL = /\[id::\s*[a-zA-Z0-9_-]+\]/gi;
export const DATAVIEW_PARENTHESES_ID_PATTERN_GLOBAL =
  /\(id::\s*[a-zA-Z0-9_-]+\)/gi;

// Dependency/link patterns - for matching and capturing dependencies
export const CSV_LINKS_PATTERN = /⛔\s*([a-zA-Z0-9_-]+(?:,[a-zA-Z0-9_-]+)*)/g;
export const INDIVIDUAL_LINKS_PATTERN =
  /⛔\s*([a-zA-Z0-9_-]+)(?!,[a-zA-Z0-9_-]+)/g;
export const DATAVIEW_BRACKET_DEPENDS_PATTERN =
  /\[dependsOn::\s*([a-zA-Z0-9_-]+(?:,\s*[a-zA-Z0-9_-]+)*)\]/g;
export const DATAVIEW_PARENTHESES_DEPENDS_PATTERN =
  /\(dependsOn::\s*([a-zA-Z0-9_-]+(?:,\s*[a-zA-Z0-9_-]+)*)\)/g;

// Date field names recognized by the Tasks plugin / Dataview
export const DATE_FIELD_NAMES =
  "due|scheduled|start|created|completion|done|canceled|cancelled";

// Dataview date fields: [due:: 2025-01-01], [[due::2025-01-01]], (due:: 2025-01-01)
export const DATAVIEW_DATE_FIELD_REMOVAL = new RegExp(
  `[[(]{1,2}(?:${DATE_FIELD_NAMES})::\\s*\\d{4}-\\d{2}-\\d{2}[\\])]{1,2}`,
  "gi"
);

// Plain-text date fields: due:2025-01-01, scheduled: 2025-01-01
export const TEXT_DATE_FIELD_REMOVAL = new RegExp(
  `(?:^|\\s)(?:${DATE_FIELD_NAMES}):\\s*\\d{4}-\\d{2}-\\d{2}(?=\\s|$)`,
  "gi"
);

// Cleaning patterns - for removing metadata (no capture groups)
export const EMOJI_ID_REMOVAL = /🆔\s+\S+/g;
export const DATAVIEW_BRACKET_ID_REMOVAL = /\[id::\s*\S+\]/g;
export const DATAVIEW_PARENTHESES_ID_REMOVAL = /\(id::\s*\S+\)/g;
export const TAG_REMOVAL = /#\S+/g;
export const WHITESPACE_NORMALIZE = /\s+/g;

// Tag pattern - for parsing tags
export const TAG_PATTERN = /(?:^|\s)#(\S+)/g;

// Priority pattern - for Obsidian Tasks plugin priority emojis
export const PRIORITY_PATTERN =
  /([\u{1F53A}\u{23EB}\u{1F53C}\u{1F53D}\u{23EC}])/u;

// Star pattern - for detecting starred tasks
export const STAR_PATTERN = /⭐/;
export const STAR_PATTERN_GLOBAL = /⭐/g;

// Obsidian Tasks signifiers. The Tasks plugin parses these from the end of a
// task line, so any text we append must stay in front of them or the last
// field gets absorbed into the description.
// See: https://publish.obsidian.md/tasks/Reference/Task+Formats/Tasks+Emoji+Format
export const TASKS_SIGNIFIERS = [
  "\u{1F194}", // 🆔 id
  "\u{26D4}", // ⛔ blocked by
  "\u{1F53A}", // 🔺 highest priority
  "\u{23EB}", // ⏫ high priority
  "\u{1F53C}", // 🔼 medium priority
  "\u{1F53D}", // 🔽 low priority
  "\u{23EC}", // ⏬ lowest priority
  "\u{1F501}", // 🔁 recurrence
  "\u{2795}", // ➕ created
  "\u{1F6EB}", // 🛫 start
  "\u{23F3}", // ⏳ scheduled
  "\u{1F4C5}", // 📅 due
  "\u{2705}", // ✅ done
  "\u{274C}", // ❌ cancelled
  "\u{1F3C1}", // 🏁 on completion
] as const;

// Start of the trailing metadata block: either a Tasks signifier or a Dataview
// inline field such as [id:: abc123] / (dependsOn:: abc123).
export const TASKS_METADATA_START_PATTERN = new RegExp(
  `(?:${TASKS_SIGNIFIERS.join("|")}|[[(][^\\]\\)]*::)`,
  "u"
);
