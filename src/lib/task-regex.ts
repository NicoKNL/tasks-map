/**
 * Shared regex patterns for task parsing and manipulation
 */

// ID patterns - for matching and capturing IDs (no 'g' flag for .match())
export const EMOJI_ID_PATTERN = /🆔\s*([a-zA-Z0-9_\-]+)/i;
export const DATAVIEW_BRACKET_ID_PATTERN = /\[id::\s*([a-zA-Z0-9_\-]+)\]/i;
export const DATAVIEW_PARENTHESES_ID_PATTERN = /\(id::\s*([a-zA-Z0-9_\-]+)\)/i;


// ID patterns for removal/global replacement (with 'g' flag)
export const EMOJI_ID_PATTERN_GLOBAL = /🆔\s*[a-zA-Z0-9_\-]+/gi;
export const DATAVIEW_BRACKET_ID_PATTERN_GLOBAL = /\[id::\s*[a-zA-Z0-9_\-]+\]/gi;
export const DATAVIEW_PARENTHESES_ID_PATTERN_GLOBAL = /\(id::\s*[a-zA-Z0-9_\-]+\)/gi;

// Dependency/link patterns - for matching and capturing dependencies
export const CSV_LINKS_PATTERN = /⛔\s*([a-zA-Z0-9_\-]+(?:,[a-zA-Z0-9_\-]+)*)/g;
export const INDIVIDUAL_LINKS_PATTERN =
  /⛔\s*([a-zA-Z0-9_\-]+)(?!,[a-zA-Z0-9_\-]+)/g;
export const DATAVIEW_BRACKET_DEPENDS_PATTERN =
  /\[dependsOn::\s*([a-zA-Z0-9_\-]+(?:,\s*[a-zA-Z0-9_\-]+)*)\]/g;
export const DATAVIEW_PARENTHESES_DEPENDS_PATTERN =
  /\(dependsOn::\s*([a-zA-Z0-9_\-]+(?:,\s*[a-zA-Z0-9_\-]+)*)\)/g;

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
