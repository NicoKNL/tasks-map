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

    const linkingSetting = new Setting(containerEl)
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
    previewContainer.style.marginTop = "8px";
    previewContainer.style.padding = "12px";
    previewContainer.style.backgroundColor = "var(--background-secondary)";
    previewContainer.style.borderRadius = "6px";
    previewContainer.style.fontFamily = "var(--font-monospace)";
    previewContainer.style.fontSize = "13px";
    previewContainer.style.border =
      "1px solid var(--background-modifier-border)";

    const updatePreview = (style: "individual" | "csv") => {
      if (style === "individual") {
        previewContainer.innerHTML = `
          <div style="margin-bottom: 6px; font-weight: 600; color: var(--text-normal);">Individual Style:</div>
          <div style="color: var(--text-muted);">Each dependency with its own emoji identifier</div>
          <div style="margin-top: 4px; color: var(--text-normal);">- [ ] My task 🆔 abc123 🆔 def456 🆔 ghi789</div>
        `;
      } else {
        previewContainer.innerHTML = `
          <div style="margin-bottom: 6px; font-weight: 600; color: var(--text-normal);">CSV Style (Tasks plugin default):</div>
          <div style="color: var(--text-muted);">Multiple dependencies comma-separated</div>
          <div style="margin-top: 4px; color: var(--text-normal);">- [ ] My task 🆔 abc123,def456,ghi789</div>
        `;
      }
    };

    // Initialize preview
    updatePreview(this.plugin.settings.linkingStyle);
  }
}
