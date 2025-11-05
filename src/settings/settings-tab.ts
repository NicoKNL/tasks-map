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
  }
}
