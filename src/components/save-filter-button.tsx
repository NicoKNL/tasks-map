import React from "react";
import { Notice } from "obsidian";
import { useApp } from "../hooks/hooks";
import { Save } from "lucide-react";
import TasksMapPlugin from "../main";
import { saveFilterSettingsToFile, CurrentFilterState } from "../lib/filter-save-utils";
import { TaskStatus } from "src/types/task";

interface SaveFilterButtonProps {
  selectedTags: string[];
  excludedTags: string[];
  selectedStatuses: TaskStatus[];
  selectedFiles: string[];
  hideTags?: boolean;
  layoutDirection?: "Horizontal" | "Vertical";
  showPriorities?: boolean;
  showTags?: boolean;
}

const SaveFilterButton: React.FC<SaveFilterButtonProps> = ({
  selectedTags,
  excludedTags,
  selectedStatuses,
  selectedFiles,
  hideTags,
  layoutDirection,
  showPriorities,
  showTags,
}: SaveFilterButtonProps) => {
  const app = useApp();

  const handleSave = async () => {
    try {
      // 获取插件实例
      const plugin = (
        app as unknown as {
          plugins: { plugins: Record<string, TasksMapPlugin> };
        }
      ).plugins.plugins["tasks-map"] as TasksMapPlugin;

      if (!plugin) {
        new Notice("无法找到tasks-map插件");
        return;
      }

      // 获取当前活动文件
      const activeFile = app.workspace.getActiveFile();
      let defaultPath = "tasks-map-filter.md";

      if (activeFile && activeFile.extension === "md") {
        const parentPath = activeFile.parent?.path || "";
        defaultPath = `${parentPath}/${activeFile.basename}-filter.md`;
      }

      // 使用新的保存函数，将配置存储在正文JSON代码块中
      await saveFilterSettingsToFile(
        app,
        defaultPath,
        {
          selectedTags,
          excludedTags,
          selectedStatuses: selectedStatuses as unknown as TaskStatus[],
          selectedFiles,
          hideTags,
          layoutDirection,
          showPriorities,
          showTags,
        },
        plugin.settings
      );

    } catch (error) {
      console.error("保存过滤设置失败:", error);
      new Notice(`保存过滤设置失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <button
      className="tasks-map-save-filter-button"
      onClick={handleSave}
      title="保存当前过滤设置到Markdown文件"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "4px",
        padding: "4px 8px",
        backgroundColor: "var(--interactive-accent)",
        color: "var(--text-on-accent)",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        fontSize: "12px",
      }}
    >
      <Save size={14} />
      <span>保存过滤</span>
    </button>
  );
};

export default SaveFilterButton;
