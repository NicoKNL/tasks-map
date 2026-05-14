export interface EmbedConfig {
  showMinimap: boolean;
  showFilterPanel: boolean;
  showPresetsPanel: boolean;
  showUnlinkedPanel: boolean;
  hideUnlinkedTasks: boolean;
  showStatusCounts: boolean;
}

export const DEFAULT_EMBED_CONFIG: EmbedConfig = {
  showMinimap: true,
  showFilterPanel: true,
  showPresetsPanel: true,
  showUnlinkedPanel: true,
  hideUnlinkedTasks: true,
  showStatusCounts: true,
};
