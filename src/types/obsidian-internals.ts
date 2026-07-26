import type { App } from "obsidian";
import type { RawTask } from "src/types/task";

/**
 * Obsidian's public `App` type intentionally does not expose the internal
 * plugin registry (`app.plugins`). These interfaces describe only the small
 * slice of that undocumented surface this plugin actually reads, so we can
 * access it in a type-safe way without resorting to `any`.
 *
 * Registry access is documented for Dataview here:
 * https://blacksmithgu.github.io/obsidian-dataview/api/intro/#plugin-access
 */

export interface DataviewPageFile {
  tasks?: { values?: RawTask[] };
}

export interface DataviewPage {
  file?: DataviewPageFile;
}

export interface DataviewApi {
  pages(_source?: string): Iterable<DataviewPage>;
}

export interface InternalPlugin {
  /** Obsidian Tasks plugin API (typed by the caller). */
  apiV1?: unknown;
  /** Dataview query API. */
  api?: DataviewApi;
  /** Dataview index status. */
  index?: { initialized?: boolean };
}

export interface PluginRegistry {
  plugins?: Record<string, InternalPlugin | undefined>;
  manifests?: Record<string, unknown>;
  enabledPlugins?: Set<string>;
}

/** `App` augmented with the undocumented plugin registry. */
export interface AppWithPlugins extends App {
  plugins: PluginRegistry;
}
