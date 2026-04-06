import React from "react";
import {
  WorkspaceLeaf,
  Plugin,
  TFile,
  FuzzySuggestModal,
  MarkdownRenderChild,
} from "obsidian";
import { createRoot } from "react-dom/client";

import TaskMapGraphItemView, { VIEW_TYPE } from "./views/TaskMapGraphItemView";
import TaskMapGraphEmbedView, {
  TaskMapEmbedError,
  filterStateFromSource,
} from "./views/TaskMapGraphEmbedView";
import {
  TasksMapSettings,
  DEFAULT_SETTINGS,
  FilterPreset,
} from "./types/settings";
import { TasksMapSettingTab } from "./settings/settings-tab";
import { initI18n, changeLanguage, t } from "./i18n";
import { FilterState, DEFAULT_FILTER_STATE } from "./types/filter-state";
import { EmbedConfig, DEFAULT_EMBED_CONFIG } from "./types/embed-config";
import { checkDataviewPlugin } from "./lib/utils";

const EMBED_CODE_BLOCK = "tasks-map";

class NoteSuggestModal extends FuzzySuggestModal<TFile> {
  private onChoose: (_file: TFile) => void;

  constructor(
    app: InstanceType<typeof Plugin>["app"],
    onChoose: (_file: TFile) => void
  ) {
    super(app);
    this.onChoose = onChoose;
    this.setPlaceholder(t("embed.pick_note_placeholder"));
  }

  getItems(): TFile[] {
    return this.app.vault.getMarkdownFiles();
  }

  getItemText(file: TFile): string {
    return file.path;
  }

  onChooseItem(file: TFile): void {
    this.onChoose(file);
  }
}

export default class TasksMapPlugin extends Plugin {
  settings: TasksMapSettings = {
    ...DEFAULT_SETTINGS,
    filterPresets: [...DEFAULT_SETTINGS.filterPresets],
  };

  async onload() {
    // Load settings
    await this.loadSettings();

    // Initialize i18n with saved language
    await initI18n(this.settings.language);

    // Always register the view - it will handle the Dataview check internally
    this.registerView(
      VIEW_TYPE,
      (leaf: WorkspaceLeaf) => new TaskMapGraphItemView(leaf)
    );

    this.addSettingTab(new TasksMapSettingTab(this.app, this));

    this.addCommand({
      id: "open-tasks-map-view",
      name: t("commands.open_map_view"),
      callback: () => {
        this.activateViewInMainArea();
      },
    });

    this.addCommand({
      id: "insert-filter-as-code-block",
      name: t("commands.insert_filter_as_code_block"),
      callback: () => {
        this.insertFilterIntoActiveNote(null);
      },
    });

    this.addRibbonIcon("map", t("ribbon.open_tasks_map"), () => {
      this.activateViewInMainArea();
    });

    // Register the tasks-map fenced code block processor
    this.registerMarkdownCodeBlockProcessor(
      EMBED_CODE_BLOCK,
      (source, el, ctx) => {
        const dataviewCheck = checkDataviewPlugin(this.app);

        const root = createRoot(el);

        // Register cleanup via MarkdownRenderChild so the root is unmounted
        // when the embed is removed or the preview re-renders
        const child = new MarkdownRenderChild(el);
        child.onunload = () => root.unmount();
        ctx.addChild(child);

        if (!dataviewCheck.isReady) {
          root.render(
            <TaskMapEmbedError message={t("embed.dataview_required")} />
          );
          return;
        }

        const parsed = filterStateFromSource(source);

        if (parsed.kind === "invalid") {
          root.render(<TaskMapEmbedError message={t("embed.invalid_json")} />);
          return;
        }

        if (parsed.kind === "legacy") {
          root.render(<TaskMapEmbedError message={t("embed.legacy_format")} />);
          return;
        }

        root.render(
          <TaskMapGraphEmbedView
            plugin={this}
            initialFilter={parsed.filter}
            embedConfig={parsed.config}
          />
        );
      }
    );
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
    // Update language when settings change
    changeLanguage(this.settings.language);
    // Notify open views of settings change
    window.dispatchEvent(new Event("tasks-map:settings-changed"));
  }

  async savePreset(name: string, filter: FilterState): Promise<void> {
    const preset: FilterPreset = {
      id: crypto.randomUUID(),
      name: name.trim(),
      filter,
    };
    this.settings.filterPresets = [...this.settings.filterPresets, preset];
    await this.saveSettings();
  }

  async renamePreset(id: string, name: string): Promise<void> {
    this.settings.filterPresets = this.settings.filterPresets.map((p) =>
      p.id === id ? { ...p, name: name.trim() } : p
    );
    await this.saveSettings();
  }

  async deletePreset(id: string): Promise<void> {
    this.settings.filterPresets = this.settings.filterPresets.filter(
      (p) => p.id !== id
    );
    await this.saveSettings();
  }

  insertPresetIntoNote(preset: FilterPreset): void {
    new NoteSuggestModal(this.app, async (file) => {
      await this.appendCodeBlockToFile(
        file,
        preset.filter,
        DEFAULT_EMBED_CONFIG
      );
    }).open();
  }

  insertFilterIntoActiveNote(filter: FilterState | null): void {
    const activeFile = this.app.workspace.getActiveFile();
    const filterToInsert = filter ?? this.getCurrentFilterState();

    if (activeFile) {
      void this.appendCodeBlockToFile(
        activeFile,
        filterToInsert,
        DEFAULT_EMBED_CONFIG
      );
    } else {
      new NoteSuggestModal(this.app, async (file) => {
        await this.appendCodeBlockToFile(
          file,
          filterToInsert,
          DEFAULT_EMBED_CONFIG
        );
      }).open();
    }
  }

  private getCurrentFilterState(): FilterState {
    const leaf = this.app.workspace.getMostRecentLeaf();
    if (leaf?.view instanceof TaskMapGraphItemView) {
      return leaf.view.getFilterState();
    }
    // Fall back to an empty filter if no active Tasks Map view is found
    return { ...DEFAULT_FILTER_STATE };
  }

  private async appendCodeBlockToFile(
    file: TFile,
    filter: FilterState,
    config: EmbedConfig
  ): Promise<void> {
    const payload = JSON.stringify({ filter, config }, null, 2);
    const block = `\n\`\`\`${EMBED_CODE_BLOCK}\n${payload}\n\`\`\`\n`;
    const existing = await this.app.vault.read(file);
    await this.app.vault.modify(file, existing + block);
  }

  async activateViewInMainArea() {
    const leaf = this.app.workspace.getLeaf(true); // true = main area
    await leaf.setViewState({ type: VIEW_TYPE, active: true });
    this.app.workspace.revealLeaf(leaf);
  }

  async onunload() {
    // Embed roots are cleaned up individually via MarkdownRenderChild
  }
}
