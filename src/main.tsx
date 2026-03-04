import { WorkspaceLeaf, Plugin, TFile } from "obsidian";

import TaskMapGraphItemView, { VIEW_TYPE } from "./views/TaskMapGraphItemView";
import { TasksMapSettings, DEFAULT_SETTINGS } from "./types/settings";
import { TasksMapSettingTab } from "./settings/settings-tab";
import { initI18n, changeLanguage, t } from "./i18n";
import * as FilterSettings from "./types/filter-settings";

export default class TasksMapPlugin extends Plugin {
  settings: TasksMapSettings = DEFAULT_SETTINGS;
  private activeFilterSettings: any = null;
  private currentFilterState: any = null;
  private isSwitchingToTasksMap = false; // 防止重复切换的标志
  private lastProcessedFile: string | null = null; // 最后处理的文件路径
  private lastProcessingTime: number = 0; // 最后处理的时间戳

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

    this.addRibbonIcon("map", t("ribbon.open_tasks_map"), () => {
      this.activateViewInMainArea();
    });

      // 监听活动叶子变化，检查当前文件是否需要切换到任务地图视图
    // 只监听这一个事件，避免重复触发
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", async (leaf) => {
        if (!leaf || this.isSwitchingToTasksMap) {
          return;
        }

        const view = leaf.view;
        if (view && view.getViewType() === "markdown") {
          const file = (view as any).file;
          if (file && file.extension === "md") {
            await this.checkAndSwitchToTasksMapView(file);
          }
        }
      })
    );
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
    // Update language when settings change
    changeLanguage(this.settings.language);
  }

  async activateViewInMainArea() {
    const leaf = this.app.workspace.getLeaf(true); // true = main area
    await leaf.setViewState({ type: VIEW_TYPE, active: true });
    this.app.workspace.revealLeaf(leaf);
  }

  /**
   * 检查文件是否需要切换到任务地图视图
   */
  private async checkAndSwitchToTasksMapView(file: TFile): Promise<void> {
    const now = Date.now();
    const filePath = file.path;

    // 防抖处理：避免短时间内重复处理同一文件
    if (this.lastProcessedFile === filePath && now - this.lastProcessingTime < 1000) {
      return;
    }

    try {
      // 检查是否已经是任务地图视图
      const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE);

      // 快速检查：如果已经有任务地图视图且是活动视图，则不需要处理
      if (leaves.length > 0) {
        const activeLeaf = this.app.workspace.activeLeaf;
        if (activeLeaf && activeLeaf.view && activeLeaf.view.getViewType() === VIEW_TYPE) {
          // 当前已经是任务地图视图，不需要切换
          this.lastProcessedFile = filePath;
          this.lastProcessingTime = now;
          return;
        }
      }

      // 检查文件是否有tasksMapView标记
      const hasTasksMapView = await this.checkFileForTasksMapView(file);

      if (hasTasksMapView) {
        // 防止重复处理
        if (this.isSwitchingToTasksMap) {
          return;
        }

        this.isSwitchingToTasksMap = true;

        try {
          // 切换到任务地图视图
          await this.switchToTasksMapView();

          // 更新最后处理信息
          this.lastProcessedFile = filePath;
          this.lastProcessingTime = Date.now();
        } finally {
          // 使用setTimeout确保标志在事件循环结束后重置
          setTimeout(() => {
            this.isSwitchingToTasksMap = false;
          }, 1000); // 1秒的防抖时间
        }
      } else {
        // 文件没有tasksMapView标记，也更新最后处理信息
        this.lastProcessedFile = filePath;
        this.lastProcessingTime = now;
      }
    } catch (error) {
      console.error("Error checking tasks map view:", error);
      // 出错时也更新最后处理信息，避免重复尝试
      this.lastProcessedFile = filePath;
      this.lastProcessingTime = Date.now();
    }
  }

  /**
   * 检查文件是否包含tasksMapView标记
   */
  private async checkFileForTasksMapView(file: TFile): Promise<boolean> {
    try {
      // 读取文件内容
      const content = await this.app.vault.read(file);
      const lines = content.split("\n");

      // 检查是否有frontmatter
      if (lines.length < 2 || lines[0] !== "---") {
        return false;
      }

      // 查找frontmatter结束位置
      let frontmatterEnd = -1;
      for (let i = 1; i < lines.length; i++) {
        if (lines[i] === "---") {
          frontmatterEnd = i;
          break;
        }
      }

      if (frontmatterEnd === -1) {
        return false;
      }

      // 提取frontmatter内容
      const frontmatterYaml = lines.slice(1, frontmatterEnd).join("\n");
      const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter;

      if (!frontmatter) {
        return false;
      }

      // 检查是否有tasksMapView标记
      const hasTasksMapView = frontmatter.tasksMapView === true;
      if (!hasTasksMapView) {
        return false;
      }

      // 使用新的extractFilterSettingsFromContent函数提取过滤设置
      const filterSettings = FilterSettings.extractFilterSettingsFromContent(content);

      // 保存过滤设置，供视图使用
      this.activeFilterSettings = filterSettings;
      return true;
    } catch (error) {
      console.error("Error checking file for tasks map view:", error);
      return false;
    }
  }

  /**
   * 切换到任务地图视图
   */
  private async switchToTasksMapView(): Promise<void> {
    // 检查是否已经有任务地图视图
    const existingLeaves = this.app.workspace.getLeavesOfType(VIEW_TYPE);

    if (existingLeaves.length > 0) {
      // 使用现有的任务地图视图
      // 找到第一个可用的叶子
      for (const leaf of existingLeaves) {
        if (leaf && leaf.view) {
          // 确保视图状态正确
          await leaf.setViewState({ type: VIEW_TYPE, active: true });
          this.app.workspace.revealLeaf(leaf);
          return;
        }
      }
    }

    // 没有现有的任务地图视图，创建新的
    // 首先尝试获取当前活动叶子
    const activeLeaf = this.app.workspace.activeLeaf;
    if (activeLeaf && activeLeaf.view && activeLeaf.view.getViewType() === "markdown") {
      // 在当前活动叶子中切换视图
      await activeLeaf.setViewState({ type: VIEW_TYPE, active: true });
      this.app.workspace.revealLeaf(activeLeaf);
    } else {
      // 创建新的叶子
      const leaf = this.app.workspace.getLeaf(true); // 在主区域创建新叶子
      await leaf.setViewState({ type: VIEW_TYPE, active: true });
      this.app.workspace.revealLeaf(leaf);
    }
  }

  /**
   * 获取当前活动的过滤设置
   */
  getActiveFilterSettings(): any {
    return this.activeFilterSettings;
  }

  /**
   * 清除当前活动的过滤设置
   */
  clearActiveFilterSettings(): void {
    this.activeFilterSettings = null;
  }

  /**
   * 更新当前过滤状态
   */
  updateCurrentFilterState(filterState: any): void {
    this.currentFilterState = filterState;
  }

  async onunload() {
    // Release any resources configured by the plugin.
  }
}
