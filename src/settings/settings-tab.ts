import { App, PluginSettingTab, Setting } from "obsidian";
import TasksMapPlugin from "../main";

export class TasksMapSettingTab extends PluginSettingTab {
  plugin: TasksMapPlugin;

  constructor(app: App, plugin: TasksMapPlugin) {
    super(app, plugin);
    this.plugin = plugin;
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
