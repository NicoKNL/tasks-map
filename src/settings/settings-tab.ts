import { App, PluginSettingTab, Setting } from "obsidian";
import TasksMapPlugin from "../main";
import { getTagColor } from "../lib/utils";

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

    new Setting(containerEl).setHeading().setName("Display Options");

    new Setting(containerEl)
      .setName("Show task priorities")
      .setDesc("Display priority indicators on task nodes")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showPriorities)
          .onChange(async (value) => {
            this.plugin.settings.showPriorities = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Show task tags")
      .setDesc("Display tags on task nodes")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showTags)
          .onChange(async (value) => {
            this.plugin.settings.showTags = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl).setHeading().setName("Layout");

    new Setting(containerEl)
      .setName("Layout direction")
      .setDesc("Direction for the node layout")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("Horizontal", "Horizontal")
          .addOption("Vertical", "Vertical")
          .setValue(this.plugin.settings.layoutDirection)
          .onChange(async (value) => {
            this.plugin.settings.layoutDirection = value as
              | "Horizontal"
              | "Vertical";
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl).setHeading().setName("Tag Appearance");

    new Setting(containerEl)
      .setName("Tag color mode")
      .setDesc("Choose how tag colors are generated")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("random", "Random colors (seeded)")
          .addOption("static", "Static color for all tags")
          .setValue(this.plugin.settings.tagColorMode)
          .onChange(async (value) => {
            this.plugin.settings.tagColorMode = value as "random" | "static";
            await this.plugin.saveSettings();
            this.display(); // Refresh to show/hide conditional settings
          })
      );

    if (this.plugin.settings.tagColorMode === "random") {
      new Setting(containerEl)
        .setName("Color seed")
        .setDesc(
          "Seed value for random color generation (same seed = same colors)"
        )
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
        .setName("Preview")
        .setDesc("Example tags with random colors");

      this.createTagPreview(
        previewSetting.settingEl,
        ["priority", "bug", "feature", "documentation"],
        "random",
        this.plugin.settings.tagColorSeed
      );
    }

    if (this.plugin.settings.tagColorMode === "static") {
      new Setting(containerEl)
        .setName("Static tag color")
        .setDesc("Color to use for all tags")
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
        .setName("Preview")
        .setDesc("Example tags with static color");

      this.createTagPreview(
        previewSetting.settingEl,
        ["priority", "bug", "feature", "documentation"],
        "static",
        42,
        this.plugin.settings.tagStaticColor
      );
    }

    new Setting(containerEl).setHeading().setName("Simple Task Relations");

    new Setting(containerEl)
      .setName("Linking style")
      .setDesc("How task dependencies are specified in simple tasks")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("csv", "CSV (Tasks plugin default)")
          .addOption("individual", "Individual")
          .setValue(this.plugin.settings.linkingStyle)
          .onChange(async (value) => {
            this.plugin.settings.linkingStyle = value as "individual" | "csv";
            await this.plugin.saveSettings();
            updatePreview(value as "individual" | "csv");
          })
      );

    // Create preview container
    const previewContainer = containerEl.createDiv();
    previewContainer.addClass("tasks-map-preview-container");

    const updatePreview = (style: "individual" | "csv") => {
      previewContainer.empty();

      if (style === "individual") {
        const title = previewContainer.createDiv({
          cls: "tasks-map-preview-title",
        });
        title.textContent = "Individual Style:";

        const desc = previewContainer.createDiv({
          cls: "tasks-map-preview-desc",
        });
        desc.textContent = "Each dependency with its own emoji identifier";

        const example = previewContainer.createDiv({
          cls: "tasks-map-preview-example",
        });
        example.textContent = "- [ ] My task ⛔ abc123 ⛔ def456 ⛔ ghi789";
      } else {
        const title = previewContainer.createDiv({
          cls: "tasks-map-preview-title",
        });
        title.textContent = "CSV Style (Tasks plugin default):";

        const desc = previewContainer.createDiv({
          cls: "tasks-map-preview-desc",
        });
        desc.textContent = "Multiple dependencies comma-separated";

        const example = previewContainer.createDiv({
          cls: "tasks-map-preview-example",
        });
        example.textContent = "- [ ] My task ⛔ abc123,def456,ghi789";
      }
    };

    // Initialize preview
    updatePreview(this.plugin.settings.linkingStyle);

    new Setting(containerEl).setHeading().setName("Advanced Options");

    new Setting(containerEl)
      .setName("Debug visualization")
      .setDesc("Show additional debug information in the graph view")
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
