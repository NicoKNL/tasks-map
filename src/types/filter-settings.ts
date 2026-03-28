import { TaskStatus } from "./task";
import { parseYaml, stringifyYaml } from "obsidian";

export interface TasksMapFilterSettings {
  // 标记该文件属于tasks-map插件
  tasksMapView?: boolean;
  
  // 过滤设置
  selectedTags?: string[];
  excludedTags?: string[];
  selectedStatuses?: TaskStatus[];
  selectedFiles?: string[];
  
  // 其他可能的视图设置
  hideTags?: boolean;
  layoutDirection?: "Horizontal" | "Vertical";
  showPriorities?: boolean;
  showTags?: boolean;
}

/**
 * 从frontmatter数据中提取过滤设置
 * @deprecated 使用 extractFilterSettingsFromContent 替代
 */
export function extractFilterSettingsFromFrontmatter(frontmatter: any): TasksMapFilterSettings {
  if (!frontmatter || typeof frontmatter !== 'object') {
    return {};
  }
  
  return {
    tasksMapView: frontmatter.tasksMapView === true,
    selectedTags: Array.isArray(frontmatter.selectedTags) ? frontmatter.selectedTags : [],
    excludedTags: Array.isArray(frontmatter.excludedTags) ? frontmatter.excludedTags : [],
    selectedStatuses: Array.isArray(frontmatter.selectedStatuses) ? frontmatter.selectedStatuses : [],
    selectedFiles: Array.isArray(frontmatter.selectedFiles) ? frontmatter.selectedFiles : [],
    hideTags: frontmatter.hideTags === true,
    layoutDirection: frontmatter.layoutDirection === "Vertical" ? "Vertical" : "Horizontal",
    showPriorities: frontmatter.showPriorities !== false, // 默认true
    showTags: frontmatter.showTags !== false, // 默认true
  };
}

/**
 * 将过滤设置转换为frontmatter数据
 * @deprecated 使用 generateFilterSettingsContent 替代
 */
export function convertFilterSettingsToFrontmatter(settings: TasksMapFilterSettings): any {
  const frontmatter: any = {};
  
  // 始终标记为tasks-map视图
  frontmatter.tasksMapView = true;
  
  // 只保存非空的过滤设置
  if (settings.selectedTags && settings.selectedTags.length > 0) {
    frontmatter.selectedTags = settings.selectedTags;
  }
  
  if (settings.excludedTags && settings.excludedTags.length > 0) {
    frontmatter.excludedTags = settings.excludedTags;
  }
  
  if (settings.selectedStatuses && settings.selectedStatuses.length > 0) {
    frontmatter.selectedStatuses = settings.selectedStatuses;
  }
  
  if (settings.selectedFiles && settings.selectedFiles.length > 0) {
    frontmatter.selectedFiles = settings.selectedFiles;
  }
  
  // 保存视图设置（如果有变化）
  if (settings.hideTags !== undefined) {
    frontmatter.hideTags = settings.hideTags;
  }
  
  if (settings.layoutDirection !== undefined) {
    frontmatter.layoutDirection = settings.layoutDirection;
  }
  
  if (settings.showPriorities !== undefined) {
    frontmatter.showPriorities = settings.showPriorities;
  }
  
  if (settings.showTags !== undefined) {
    frontmatter.showTags = settings.showTags;
  }
  
  return frontmatter;
}
/**
 * 从文件内容中提取过滤设置
 * 优先从正文中的JSON配置块读取，如果不存在则从frontmatter读取（向后兼容）
 */
export function extractFilterSettingsFromContent(content: string): TasksMapFilterSettings {
  if (!content || typeof content !== 'string') {
    return {};
  }

  const lines = content.split('\n');

  // 1. 尝试从正文中的JSON配置块提取设置（新格式）
  const jsonMatch = content.match(/```json tasks-map-filter\n([\s\S]*?)\n```/);
  if (jsonMatch) {
    try {
      const jsonStr = jsonMatch[1].trim();
      const settings = JSON.parse(jsonStr);

      // 验证并转换设置
      return {
        tasksMapView: true, // 有配置块就意味着使用tasks-map视图
        selectedTags: Array.isArray(settings.selectedTags) ? settings.selectedTags : [],
        excludedTags: Array.isArray(settings.excludedTags) ? settings.excludedTags : [],
        selectedStatuses: Array.isArray(settings.selectedStatuses) ? settings.selectedStatuses : [],
        selectedFiles: Array.isArray(settings.selectedFiles) ? settings.selectedFiles : [],
        hideTags: settings.hideTags === true,
        layoutDirection: settings.layoutDirection === "Vertical" ? "Vertical" : "Horizontal",
        showPriorities: settings.showPriorities !== false,
        showTags: settings.showTags !== false,
      };
    } catch (error) {
      console.error('Failed to parse tasks-map-filter JSON:', error);
      // 如果JSON解析失败，回退到frontmatter
    }
  }

  // 2. 如果没有JSON配置块，检查frontmatter（向后兼容旧格式）
  if (lines.length >= 2 && lines[0] === '---') {
    let endIndex = -1;
    for (let i = 1; i < lines.length; i++) {
      if (lines[i] === '---') {
        endIndex = i;
        break;
      }
    }

    if (endIndex !== -1) {
      const frontmatterYaml = lines.slice(1, endIndex).join('\n');
      try {
        const frontmatter = parseYaml(frontmatterYaml) || {};
        // 使用旧的提取函数
        return extractFilterSettingsFromFrontmatter(frontmatter);
      } catch (error) {
        console.error('Failed to parse frontmatter YAML:', error);
      }
    }
  }

  return {};
}

/**
 * 生成包含frontmatter标识和正文配置块的文件内容
 * @param existingContent 现有文件内容（用于保留原有内容）
 * @param settings 过滤设置
 * @returns 新的文件内容
 */
export function generateFilterSettingsContent(
  existingContent: string,
  settings: TasksMapFilterSettings
): string {
  // 确保tasksMapView为true
  const settingsWithMarker = { ...settings, tasksMapView: true };

  // 准备JSON配置（排除tasksMapView字段）
  const jsonSettings: any = {};

  if (settings.selectedTags && settings.selectedTags.length > 0) {
    jsonSettings.selectedTags = settings.selectedTags;
  }

  if (settings.excludedTags && settings.excludedTags.length > 0) {
    jsonSettings.excludedTags = settings.excludedTags;
  }

  if (settings.selectedStatuses && settings.selectedStatuses.length > 0) {
    jsonSettings.selectedStatuses = settings.selectedStatuses;
  }

  if (settings.selectedFiles && settings.selectedFiles.length > 0) {
    jsonSettings.selectedFiles = settings.selectedFiles;
  }

  if (settings.hideTags !== undefined) {
    jsonSettings.hideTags = settings.hideTags;
  }

  if (settings.layoutDirection !== undefined) {
    jsonSettings.layoutDirection = settings.layoutDirection;
  }

  if (settings.showPriorities !== undefined) {
    jsonSettings.showPriorities = settings.showPriorities;
  }

  if (settings.showTags !== undefined) {
    jsonSettings.showTags = settings.showTags;
  }

  const jsonStr = JSON.stringify(jsonSettings, null, 2);
  const configBlock = `\`\`\`json tasks-map-filter\n${jsonStr}\n\`\`\``;

  // 检查existingContent是否已有frontmatter
  const lines = existingContent.split('\n');
  let frontmatterStart = -1;
  let frontmatterEnd = -1;

  if (lines.length > 0 && lines[0] === '---') {
    frontmatterStart = 0;
    for (let i = 1; i < lines.length; i++) {
      if (lines[i] === '---') {
        frontmatterEnd = i;
        break;
      }
    }
  }

  let newContent = '';

  if (frontmatterStart !== -1 && frontmatterEnd !== -1) {
    // 已有frontmatter，需要保留现有frontmatter，确保包含tasksMapView: true
    const frontmatterYaml = lines.slice(1, frontmatterEnd).join('\n');
    let frontmatter: any = {};

    try {
      frontmatter = parseYaml(frontmatterYaml) || {};
    } catch (error) {
      console.error('Failed to parse existing frontmatter:', error);
    }

    // 确保tasksMapView为true
    frontmatter.tasksMapView = true;

    // 重新生成frontmatter YAML
    const newFrontmatterYaml = stringifyYaml(frontmatter);

    // 获取正文内容（排除配置块）
    const bodyContent = lines.slice(frontmatterEnd + 1).join('\n');
    const bodyWithoutConfig = bodyContent.replace(/```json tasks-map-filter[\s\S]*?```/g, '').trim();

    // 构建新内容
    newContent = `---\n${newFrontmatterYaml}---`;

    if (bodyWithoutConfig || configBlock) {
      newContent += '\n\n';
    }

    if (configBlock) {
      newContent += configBlock;
    }

    if (bodyWithoutConfig && configBlock) {
      newContent += '\n\n';
    }

    if (bodyWithoutConfig) {
      newContent += bodyWithoutConfig;
    }
  } else {
    // 没有frontmatter，创建新的（只包含tasksMapView: true）
    const frontmatter = { tasksMapView: true };
    const frontmatterYaml = stringifyYaml(frontmatter);

    // 获取正文内容（排除配置块和可能的frontmatter）
    const bodyWithoutConfig = existingContent.replace(/```json tasks-map-filter[\s\S]*?```/g, '').trim();

    // 构建新内容
    newContent = `---\n${frontmatterYaml}---`;

    if (bodyWithoutConfig || configBlock) {
      newContent += '\n\n';
    }

    if (configBlock) {
      newContent += configBlock;
    }

    if (bodyWithoutConfig && configBlock) {
      newContent += '\n\n';
    }

    if (bodyWithoutConfig) {
      newContent += bodyWithoutConfig;
    }
  }

  return newContent;
}

