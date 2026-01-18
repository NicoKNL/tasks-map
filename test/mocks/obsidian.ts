// Mock implementations for Obsidian API
import * as yaml from "js-yaml";

export class TFile {
  path: string;
  basename: string;
  extension: string;

  constructor(path: string) {
    this.path = path;
    this.basename = path.split("/").pop()?.replace(/\.md$/, "") || "";
    this.extension = "md";
  }
}

export class Vault {
  private files: Map<string, string> = new Map();

  getAbstractFileByPath(path: string): TFile | null {
    if (this.files.has(path)) {
      return new TFile(path);
    }
    return null;
  }

  getFileByPath(path: string): TFile | null {
    return this.getAbstractFileByPath(path);
  }

  async process(file: TFile, fn: (content: string) => string): Promise<string> {
    const content = this.files.get(file.path) || "";
    const newContent = fn(content);
    this.files.set(file.path, newContent);
    return newContent;
  }

  async read(file: TFile): Promise<string> {
    return this.files.get(file.path) || "";
  }

  async modify(file: TFile, content: string): Promise<void> {
    this.files.set(file.path, content);
  }

  // Test utility methods
  setFileContent(path: string, content: string): void {
    this.files.set(path, content);
  }

  getFileContent(path: string): string {
    return this.files.get(path) || "";
  }
}

export class App {
  vault: Vault;

  constructor() {
    this.vault = new Vault();
  }
}

export class Notice {
  constructor(message: string, timeout?: number) {
    // Mock implementation - does nothing
  }
}

/**
 * Wrapper around js-yaml for Obsidian's parseYaml API
 * Matches Obsidian's behavior
 */
export function parseYaml(yamlString: string): any {
  try {
    return yaml.load(yamlString);
  } catch (e) {
    // Return empty object on parse error, similar to Obsidian
    return {};
  }
}

/**
 * Wrapper around js-yaml for Obsidian's stringifyYaml API
 * Matches Obsidian's YAML formatting style
 */
export function stringifyYaml(obj: any): string {
  return yaml.dump(obj, {
    indent: 2,
    lineWidth: -1, // Don't wrap lines
    noRefs: true, // Don't use anchors/aliases
    sortKeys: false, // Preserve key order
    quotingType: '"', // Use double quotes
    forceQuotes: false, // Only quote when necessary
  });
}
