import { App, TFile, Notice } from "obsidian";
import { parseYaml, stringifyYaml } from "obsidian";
import { generateFilterSettingsContent } from "../types/filter-settings";
import { TasksMapSettings } from "../types/settings";
import { TaskStatus } from "../types/task";

export interface CurrentFilterState {
  selectedTags: string[];
  excludedTags: string[];
  selectedStatuses: TaskStatus[];
  selectedFiles: string[];
  hideTags?: boolean;
  layoutDirection?: "Horizontal" | "Vertical";
  showPriorities?: boolean;
  showTags?: boolean;
}

/**
 * 将当前过滤设置保存到指定的Markdown文件
 * 新版本：将配置存储在正文的JSON配置块中，frontmatter只保留tasksMapView标识
 */
export async function saveFilterSettingsToFile(
  app: App,
  filePath: string,
  filterState: CurrentFilterState,
  pluginSettings: TasksMapSettings
): Promise<boolean> {
  try {
    // 获取或创建文件
    let file = app.vault.getFileByPath(filePath);
    
    if (!file) {
      // 创建新文件
      file = await app.vault.create(filePath, "");
    }
    
    // 读取文件内容
    const content = await app.vault.read(file);

    // 准备过滤设置
    const filterSettings = {
      ...filterState,
      layoutDirection: filterState.layoutDirection || pluginSettings.layoutDirection,
      showPriorities: filterState.showPriorities !== undefined ? filterState.showPriorities : pluginSettings.showPriorities,
      showTags: filterState.showTags !== undefined ? filterState.showTags : pluginSettings.showTags,
    };
    
    // 生成新的文件内容（使用新的存储格式）
    const newContent = generateFilterSettingsContent(content, filterSettings);

    // 写入文件
    await app.vault.modify(file, newContent);
    
    new Notice(`过滤设置已保存到 ${filePath}`);
    return true;
  } catch (error) {
    console.error("保存过滤设置失败:", error);
    new Notice(`保存过滤设置失败: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

/**
 * 创建保存过滤设置的命令
 */
export function createSaveFilterCommand(
  app: App,
  pluginSettings: TasksMapSettings,
  getCurrentFilterState: () => CurrentFilterState | null
) {
  return {
    id: "save-filter-settings",
    name: "保存过滤设置到Markdown文件",
    callback: async () => {
      const filterState = getCurrentFilterState();
      if (!filterState) {
        new Notice("没有可用的过滤设置");
        return;
      }
      
      // 使用当前活动文件或提示用户输入文件名
      const activeFile = app.workspace.getActiveFile();
      let defaultPath = "tasks-map-filter.md";
      
      if (activeFile && activeFile.extension === "md") {
        const parentPath = activeFile.parent?.path || "";
        defaultPath = `${parentPath}/${activeFile.basename}-filter.md`;
      }
      
      // 在实际应用中，这里应该弹出一个对话框让用户输入文件名
      // 为了简化，我们直接使用默认路径
      const filePath = defaultPath;
      
      await saveFilterSettingsToFile(app, filePath, filterState, pluginSettings);
    }
  };
}
