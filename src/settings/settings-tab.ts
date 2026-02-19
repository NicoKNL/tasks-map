import { App, Notice, PluginSettingTab, Setting, TFolder } from "obsidian";
import TasksMapPlugin from "../main";
import { getTagColor } from "../lib/utils";
import { t } from "../i18n";
import { SUPPORTED_LANGUAGES } from "../i18n";

let debounceTimer: number | null = null;

export class TasksMapSettingTab extends PluginSettingTab {
  plugin: TasksMapPlugin;

  constructor(app: App, plugin: TasksMapPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  private createTagPreview(
    container: HTMLElement,
    tags: string[],
    mode: "random" | "static",
    seed = 42,
    staticColor = "#3B82F6"
  ): void {
    container.empty();

    const previewDiv = container.createDiv({
      cls: "tag-preview-container",
    });
    previewDiv.style.display = "flex";
    previewDiv.style.gap = "8px";
    previewDiv.style.marginTop = "10px";
    previewDiv.style.flexWrap = "wrap";

    tags.forEach((tag) => {
      const tagElement = previewDiv.createSpan({
        cls: "tag-preview-pill",
        text: tag,
      });

      const backgroundColor = getTagColor(tag, mode, seed, staticColor);
      tagElement.style.backgroundColor = backgroundColor;
      tagElement.style.color = "white";
      tagElement.style.padding = "4px 8px";
      tagElement.style.borderRadius = "12px";
      tagElement.style.fontSize = "12px";
      tagElement.style.fontWeight = "500";
      tagElement.style.border = "none";
      tagElement.style.display = "inline-block";
    });
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    new Setting(containerEl)
      .setName(t("settings.language"))
      .setDesc(t("settings.language_desc"))
      .addDropdown((dropdown) => {
        SUPPORTED_LANGUAGES.forEach((lang) => {
          dropdown.addOption(lang.value, lang.label);
        });
        dropdown
          .setValue(this.plugin.settings.language)
          .onChange(async (value) => {
            this.plugin.settings.language = value as "en" | "nl" | "zh-CN";
            await this.plugin.saveSettings();
            // Redraw the settings tab with new language
            this.display();
          });
      });

    new Setting(containerEl)
      .setHeading()
      .setName(t("settings.display_options"));

    new Setting(containerEl)
      .setName(t("settings.show_task_priorities"))
      .setDesc(t("settings.show_task_priorities_desc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showPriorities)
          .onChange(async (value) => {
            this.plugin.settings.showPriorities = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(t("settings.show_task_tags"))
      .setDesc(t("settings.show_task_tags_desc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showTags)
          .onChange(async (value) => {
            this.plugin.settings.showTags = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl).setHeading().setName("Task");

    new Setting(containerEl)
      .setName("Task inbox")
      .setDesc(
        "Select an .md file as the inbox. When you double-click the panel to create a task, the task will be added to the inbox."
      )
      .addText((text) =>
        text
          .setPlaceholder("Task Inbox.md")
          .setValue(this.plugin.settings.taskInbox)
          .onChange(async (value) => {
            if (debounceTimer) {
              window.clearTimeout(debounceTimer);
            }

            debounceTimer = window.setTimeout(async () => {
              const vault = this.plugin.app.vault;
              const normalizedPath = value.trim();

              if (!normalizedPath) {
                new Notice("The path is invalid.");
                return;
              }

              if (!normalizedPath.endsWith(".md")) {
                new Notice("Task inbox must be a .md file");
                return;
              }

              try {
                const existingFile =
                  vault.getAbstractFileByPath(normalizedPath);

                if (!existingFile) {
                  await vault.create(normalizedPath, "");
                } else if (existingFile instanceof TFolder) {
                  new Notice("Task inbox path points to a folder, not a file");
                  return;
                }

                this.plugin.settings.taskInbox = normalizedPath;
                await this.plugin.saveSettings();
              } catch (error) {
                console.error("Failed to set task inbox:", error);
                new Notice("Failed to create or access the task inbox file");
              }
            }, 2000);
          })
      );

    new Setting(containerEl).setHeading().setName(t("settings.layout"));

    new Setting(containerEl)
      .setName(t("settings.layout_direction"))
      .setDesc(t("settings.layout_direction_desc"))
      .addDropdown((dropdown) =>
        dropdown
          .addOption("Horizontal", t("settings.layout_horizontal"))
          .addOption("Vertical", t("settings.layout_vertical"))
          .setValue(this.plugin.settings.layoutDirection)
          .onChange(async (value) => {
            this.plugin.settings.layoutDirection = value as
              | "Horizontal"
              | "Vertical";
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl).setHeading().setName(t("settings.tag_appearance"));

    new Setting(containerEl)
      .setName(t("settings.tag_color_mode"))
      .setDesc(t("settings.tag_color_mode_desc"))
      .addDropdown((dropdown) =>
        dropdown
          .addOption("random", t("settings.tag_color_random"))
          .addOption("static", t("settings.tag_color_static"))
          .setValue(this.plugin.settings.tagColorMode)
          .onChange(async (value) => {
            this.plugin.settings.tagColorMode = value as "random" | "static";
            await this.plugin.saveSettings();
            this.display(); // Refresh to show/hide conditional settings
          })
      );

    if (this.plugin.settings.tagColorMode === "random") {
      new Setting(containerEl)
        .setName(t("settings.color_seed"))
        .setDesc(t("settings.color_seed_desc"))
        .addText((text) =>
          text
            .setPlaceholder("42")
            .setValue(this.plugin.settings.tagColorSeed.toString())
            .onChange(async (value) => {
              const seedValue = parseInt(value) || 42;
              this.plugin.settings.tagColorSeed = seedValue;
              await this.plugin.saveSettings();
              // Update preview when seed changes
              const previewContainer = containerEl.querySelector(
                ".tag-preview-container"
              )?.parentElement;
              if (previewContainer) {
                this.createTagPreview(
                  previewContainer,
                  ["priority", "bug", "feature", "documentation"],
                  "random",
                  seedValue
                );
              }
            })
        );

      // Add preview container for random mode
      const previewSetting = new Setting(containerEl)
        .setName(t("settings.preview"))
        .setDesc(t("settings.preview_random_desc"));

      this.createTagPreview(
        previewSetting.settingEl,
        ["priority", "bug", "feature", "documentation"],
        "random",
        this.plugin.settings.tagColorSeed
      );
    }

    if (this.plugin.settings.tagColorMode === "static") {
      new Setting(containerEl)
        .setName(t("settings.static_tag_color"))
        .setDesc(t("settings.static_tag_color_desc"))
        .addColorPicker((colorPicker) =>
          colorPicker
            .setValue(this.plugin.settings.tagStaticColor)
            .onChange(async (value) => {
              this.plugin.settings.tagStaticColor = value;
              await this.plugin.saveSettings();
              // Update preview when color changes
              const previewContainer = containerEl.querySelector(
                ".tag-preview-container"
              )?.parentElement;
              if (previewContainer) {
                this.createTagPreview(
                  previewContainer,
                  ["priority", "bug", "feature", "documentation"],
                  "static",
                  42,
                  value
                );
              }
            })
        );

      // Add preview container for static mode
      const previewSetting = new Setting(containerEl)
        .setName(t("settings.preview"))
        .setDesc(t("settings.preview_static_desc"));

      this.createTagPreview(
        previewSetting.settingEl,
        ["priority", "bug", "feature", "documentation"],
        "static",
        42,
        this.plugin.settings.tagStaticColor
      );
    }

    new Setting(containerEl)
      .setHeading()
      .setName(t("settings.simple_task_relations"));

    new Setting(containerEl)
      .setName(t("settings.linking_style"))
      .setDesc(t("settings.linking_style_desc"))
      .addDropdown((dropdown) =>
        dropdown
          .addOption("csv", t("settings.linking_csv"))
          .addOption("individual", t("settings.linking_individual"))
          .addOption("dataview", t("settings.linking_dataview"))
          .setValue(this.plugin.settings.linkingStyle)
          .onChange(async (value) => {
            this.plugin.settings.linkingStyle = value as
              | "individual"
              | "csv"
              | "dataview";
            await this.plugin.saveSettings();
            updatePreview(value as "individual" | "csv" | "dataview");
          })
      );

    // Create preview container
    const previewContainer = containerEl.createDiv();
    previewContainer.addClass("tasks-map-preview-container");

    const updatePreview = (style: "individual" | "csv" | "dataview") => {
      previewContainer.empty();

      if (style === "individual") {
        const title = previewContainer.createDiv({
          cls: "tasks-map-preview-title",
        });
        title.textContent = t("settings.linking_individual_title");

        const desc = previewContainer.createDiv({
          cls: "tasks-map-preview-desc",
        });
        desc.textContent = t("settings.linking_individual_desc");

        const example = previewContainer.createDiv({
          cls: "tasks-map-preview-example",
        });
        example.textContent = t("settings.linking_individual_example");
      } else if (style === "dataview") {
        const title = previewContainer.createDiv({
          cls: "tasks-map-preview-title",
        });
        title.textContent = t("settings.linking_dataview_title");

        const desc = previewContainer.createDiv({
          cls: "tasks-map-preview-desc",
        });
        desc.textContent = t("settings.linking_dataview_desc");

        const example = previewContainer.createDiv({
          cls: "tasks-map-preview-example",
        });
        example.textContent = t("settings.linking_dataview_example");
      } else {
        const title = previewContainer.createDiv({
          cls: "tasks-map-preview-title",
        });
        title.textContent = t("settings.linking_csv_title");

        const desc = previewContainer.createDiv({
          cls: "tasks-map-preview-desc",
        });
        desc.textContent = t("settings.linking_csv_desc");

        const example = previewContainer.createDiv({
          cls: "tasks-map-preview-example",
        });
        example.textContent = t("settings.linking_csv_example");
      }
    };

    // Initialize preview
    updatePreview(this.plugin.settings.linkingStyle);

    new Setting(containerEl)
      .setHeading()
      .setName(t("settings.advanced_options"));

    new Setting(containerEl)
      .setName(t("settings.debug_visualization"))
      .setDesc(t("settings.debug_visualization_desc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.debugVisualization)
          .onChange(async (value) => {
            this.plugin.settings.debugVisualization = value;
            await this.plugin.saveSettings();
          })
      );
  }
}
