import { App, PluginSettingTab, Setting } from "obsidian";
import TasksMapPlugin from "../main";
import { TagColorPalette, getTagColorClass } from "../lib/tag-color-manager";
import { t } from "../i18n";
import { SUPPORTED_LANGUAGES } from "../i18n";

export class TasksMapSettingTab extends PluginSettingTab {
  plugin: TasksMapPlugin;

  constructor(app: App, plugin: TasksMapPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  private createTagPreview(
    container: HTMLElement,
    tags: string[],
    palette: TagColorPalette
  ): void {
    container.empty();

    const previewDiv = container.createDiv({
      cls: "tasks-map-tag-preview-container",
    });

    tags.forEach((tag) => {
      previewDiv.createSpan({
        cls: `tasks-map-tag ${getTagColorClass(tag, palette)}`,
        text: tag,
      });
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

    new Setting(containerEl)
      .setName(t("settings.show_status_counts"))
      .setDesc(t("settings.show_status_counts_desc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showStatusCounts)
          .onChange(async (value) => {
            this.plugin.settings.showStatusCounts = value;
            await this.plugin.saveSettings();
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
              "Horizontal" | "Vertical";
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(t("settings.edge_style"))
      .setDesc(t("settings.edge_style_desc"))
      .addDropdown((dropdown) =>
        dropdown
          .addOption("Bezier", t("settings.edge_style_bezier"))
          .addOption("Straight", t("settings.edge_style_straight"))
          .addOption("SmoothStep", t("settings.edge_style_smoothstep"))
          .setValue(this.plugin.settings.edgeStyle)
          .onChange(async (value) => {
            this.plugin.settings.edgeStyle = value as
              "Bezier" | "Straight" | "SmoothStep";
            await this.plugin.saveSettings();
            this.display();
          })
      );

    if (this.plugin.settings.edgeStyle === "SmoothStep") {
      new Setting(containerEl)
        .setName(t("settings.smooth_step_radius"))
        .setDesc(t("settings.smooth_step_radius_desc"))
        .addText((text) =>
          text
            .setPlaceholder("5")
            .setValue(this.plugin.settings.smoothStepRadius.toString())
            .onChange(async (value) => {
              const radius = Math.max(0, parseInt(value) || 0);
              this.plugin.settings.smoothStepRadius = radius;
              await this.plugin.saveSettings();
            })
        );
    }

    new Setting(containerEl).setHeading().setName(t("settings.tag_appearance"));

    new Setting(containerEl)
      .setName(t("settings.tag_color_palette"))
      .setDesc(t("settings.tag_color_palette_desc"))
      .addDropdown((dropdown) => {
        dropdown
          .addOption("rainbow", t("settings.palette_rainbow"))
          .addOption("ocean", t("settings.palette_ocean"))
          .addOption("forest", t("settings.palette_forest"))
          .addOption("sunset", t("settings.palette_sunset"))
          .addOption("mono", t("settings.palette_mono"))
          .setValue(this.plugin.settings.tagColorPalette)
          .onChange(async (value) => {
            this.plugin.settings.tagColorPalette = value as TagColorPalette;
            await this.plugin.saveSettings();
            this.createTagPreview(
              tagPreviewContainer,
              ["priority", "bug", "feature", "docs", "blocked"],
              value as TagColorPalette
            );
          });
      });

    const tagPreviewContainer = containerEl.createDiv();
    this.createTagPreview(
      tagPreviewContainer,
      ["priority", "bug", "feature", "docs", "blocked"],
      this.plugin.settings.tagColorPalette
    );

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
              "individual" | "csv" | "dataview";
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
