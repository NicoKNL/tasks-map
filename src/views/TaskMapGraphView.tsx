import React, { useEffect, useCallback, useMemo, useRef } from "react";
import ReactFlow, {
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
} from "reactflow";
import { Notice } from "obsidian";
import { useApp } from "src/hooks/hooks";
import {
  addLinkSignsBetweenTasks,
  getAllTasks,
  getLayoutedElements,
  removeLinkSignsBetweenTasks,
  createNodesFromTasks,
  createEdgesFromTasks,
  getUnlinkedTasks,
} from "src/lib/utils";
import { BaseTask } from "src/types/task";
import GuiOverlay from "src/components/gui-overlay";
import FilterPresetsPanel from "src/components/filter-presets-panel";
import StatusCountsOverlay from "src/components/status-counts-overlay";
import TaskNode from "src/components/task-node";
import { getFilteredNodeIds } from "src/lib/filter-tasks";
import { TaskMinimap } from "src/components/task-minimap";
import HashEdge from "src/components/hash-edge";
import { DeleteEdgeButton } from "src/components/delete-edge-button";
import { TagsContext } from "src/contexts/context";
import UnlinkedTasksPanel, {
  DRAG_DATA_KEY,
} from "src/components/unlinked-tasks-panel";
import { GraphEmptyState } from "src/components/graph-empty-state";
import ControlsPanel from "src/components/controls-panel";
import { t } from "../i18n";
import TasksMapPlugin from "../main";

import { TaskStatus } from "src/types/task";
import { TasksMapSettings } from "src/types/settings";
import { FilterState } from "src/types/filter-state";
import { EmbedConfig, DEFAULT_EMBED_CONFIG } from "src/types/embed-config";

const ALL_STATUSES: TaskStatus[] = ["todo", "in_progress", "done", "canceled"];

interface TaskMapGraphViewProps {
  settings: TasksMapSettings;
  filterState: FilterState;
  setFilterState: React.Dispatch<React.SetStateAction<FilterState>>;
  plugin: TasksMapPlugin;
  embedConfig?: EmbedConfig;
}

export default function TaskMapGraphView({
  settings,
  filterState,
  setFilterState,
  plugin,
  embedConfig,
}: TaskMapGraphViewProps) {
  const embed = { ...DEFAULT_EMBED_CONFIG, ...embedConfig };
  const app = useApp();
  const vault = app.vault;
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [tasks, setTasks] = React.useState<BaseTask[]>([]);
  const [selectedEdge, setSelectedEdge] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const reactFlowInstance = useReactFlow();
  const skipFitViewRef = React.useRef(false);

  const [hideTags, setHideTags] = React.useState(false);
  const [hideUnlinkedTasks, setHideUnlinkedTasks] = React.useState(
    embed.hideUnlinkedTasks
  );
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Tracks which unlinked task IDs have been dropped onto the canvas this session
  const [droppedTaskIds, setDroppedTaskIds] = React.useState<Set<string>>(
    new Set()
  );
  // Stores the drop position for each dropped task (bypasses dagre layout)
  const droppedNodePositions = useRef<Map<string, { x: number; y: number }>>(
    new Map()
  );

  const toggleHideTags = useCallback(() => {
    setHideTags((prev) => !prev);
  }, []);

  // Maintain a live registry of tags per task for efficient allTags computation
  const [taskTagsRegistry, setTaskTagsRegistry] = React.useState<
    Map<string, string[]>
  >(new Map());

  const allTags = useMemo(() => {
    const tagFrequency = new Map<string, number>();
    taskTagsRegistry.forEach((tags) => {
      tags.forEach((tag) => {
        tagFrequency.set(tag, (tagFrequency.get(tag) || 0) + 1);
      });
    });
    return Array.from(tagFrequency.keys()).sort((a, b) => {
      const freqDiff = (tagFrequency.get(b) || 0) - (tagFrequency.get(a) || 0);
      if (freqDiff !== 0) return freqDiff;
      return a.localeCompare(b, undefined, { sensitivity: "base" });
    });
  }, [taskTagsRegistry]);

  // Compute all unique files and folders from tasks
  const allFiles = useMemo(() => {
    const filesSet = new Set<string>();
    const foldersSet = new Set<string>();

    tasks.forEach((task) => {
      if (task.link) {
        // Add the file
        filesSet.add(task.link);

        // Extract and add all parent folders
        const parts = task.link.split("/");
        for (let i = 1; i < parts.length; i++) {
          const folder = parts.slice(0, i).join("/") + "/";
          foldersSet.add(folder);
        }
      }
    });

    // Combine folders and files, with folders first
    const folders = Array.from(foldersSet).sort();
    const files = Array.from(filesSet).sort();

    return [...folders, ...files];
  }, [tasks]);

  React.useEffect(() => {
    if (containerRef.current) {
      if (hideTags) {
        containerRef.current.classList.add("hide-tags");
      } else {
        containerRef.current.classList.remove("hide-tags");
      }
    }
  }, [hideTags]);

  const reloadTasks = useCallback(() => {
    setIsLoading(true);
    // Reset dropped state on reload so unlinked tasks return to sidebar
    setDroppedTaskIds(new Set());
    droppedNodePositions.current = new Map();
    // Use setTimeout to allow the loading UI to render before heavy computation
    setTimeout(() => {
      const newTasks = getAllTasks(app);
      setTasks(newTasks);
      const newRegistry = new Map<string, string[]>();
      newTasks.forEach((task) => {
        newRegistry.set(task.id, task.tags);
      });
      setTaskTagsRegistry(newRegistry);
      setIsLoading(false);
      new Notice("Tasks reloaded");
    }, 0);
  }, [app]);

  const updateTaskTags = useCallback((taskId: string, newTags: string[]) => {
    setTaskTagsRegistry((prevRegistry) => {
      const newRegistry = new Map(prevRegistry);
      newRegistry.set(taskId, newTags);
      return newRegistry;
    });
  }, []);

  const handleDeleteTask = useCallback((taskId: string) => {
    skipFitViewRef.current = true;
    setTasks((prevTasks) => prevTasks.filter((t) => t.id !== taskId));
    setTaskTagsRegistry((prevRegistry) => {
      const newRegistry = new Map(prevRegistry);
      newRegistry.delete(taskId);
      return newRegistry;
    });
  }, []);

  useEffect(() => {
    // Get the Dataview plugin to check index status
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dataviewPlugin = (app as any).plugins?.plugins?.["dataview"];

    // Check if Dataview index is already initialized
    if (dataviewPlugin?.index?.initialized) {
      // Index already ready, load tasks immediately
      reloadTasks();
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const metadataCache = (app as any).metadataCache;
      const eventRef = metadataCache.on("dataview:index-ready", () => {
        reloadTasks();
      });

      return () => {
        metadataCache.offref(eventRef);
      };
    }
  }, [app, reloadTasks]);

  // Update tag registry when tasks change
  useEffect(() => {
    const newRegistry = new Map<string, string[]>();
    tasks.forEach((task) => {
      newRegistry.set(task.id, task.tags);
    });
    setTaskTagsRegistry(newRegistry);
  }, [tasks]);

  // Compute which tasks are unlinked (no connections at all)
  const allUnlinkedTasks = useMemo(() => getUnlinkedTasks(tasks), [tasks]);

  // Tasks visible in the sidebar: unlinked, not yet dropped, and matching the active filter
  const sidebarTasks = useMemo(() => {
    const undroppedUnlinked = allUnlinkedTasks.filter(
      (t) => !droppedTaskIds.has(t.id)
    );
    const filteredIds = new Set(
      getFilteredNodeIds(undroppedUnlinked, filterState)
    );
    return undroppedUnlinked.filter((t) => filteredIds.has(t.id));
  }, [allUnlinkedTasks, droppedTaskIds, filterState]);

  // Tasks that are linked OR have been dropped onto the canvas this session
  // OR all tasks when hideUnlinkedTasks is disabled (unlinked appear as isolated nodes)
  const graphTasks = useMemo(() => {
    if (!hideUnlinkedTasks) return tasks;
    const unlinkedIds = new Set(allUnlinkedTasks.map((t) => t.id));
    return tasks.filter(
      (t) => !unlinkedIds.has(t.id) || droppedTaskIds.has(t.id)
    );
  }, [tasks, allUnlinkedTasks, droppedTaskIds, hideUnlinkedTasks]);

  useEffect(() => {
    let newNodes = createNodesFromTasks(
      graphTasks,
      settings.layoutDirection,
      settings.showPriorities,
      settings.showTags,
      settings.debugVisualization,
      settings.tagColorMode,
      settings.tagColorSeed,
      settings.tagStaticColor,
      handleDeleteTask
    );
    let newEdges = createEdgesFromTasks(
      graphTasks,
      settings.layoutDirection,
      settings.debugVisualization,
      settings.edgeStyle,
      settings.smoothStepRadius
    );

    const filteredNodeIds = getFilteredNodeIds(graphTasks, filterState);

    newNodes = newNodes.filter((n) => filteredNodeIds.includes(n.id));
    newEdges = newEdges.filter(
      (e) =>
        filteredNodeIds.includes(e.source) && filteredNodeIds.includes(e.target)
    );

    // Separate dropped (unlinked) nodes from linked nodes for layout
    const droppedNodes = newNodes.filter((n) => droppedTaskIds.has(n.id));
    const linkedNodes = newNodes.filter((n) => !droppedTaskIds.has(n.id));

    // Run dagre layout only on linked nodes
    const layoutedLinkedNodes = getLayoutedElements(
      linkedNodes,
      newEdges,
      settings.layoutDirection,
      settings.showTags
    );

    // Apply stored drop positions to dropped nodes (bypass dagre)
    const layoutedDroppedNodes = droppedNodes.map((n) => {
      const pos = droppedNodePositions.current.get(n.id);
      return pos ? { ...n, position: pos } : n;
    });

    setNodes([...layoutedLinkedNodes, ...layoutedDroppedNodes]);
    setEdges(newEdges);

    if (skipFitViewRef.current) {
      skipFitViewRef.current = false;
    } else {
      setTimeout(() => {
        reactFlowInstance.fitView({ duration: 400 });
      }, 1000);
    }
  }, [
    graphTasks,
    filterState,
    settings,
    reactFlowInstance,
    setNodes,
    setEdges,
    handleDeleteTask,
    droppedTaskIds,
  ]);

  const nodeTypes = useMemo(() => ({ task: TaskNode }), []);
  const edgeTypes = useMemo(() => ({ hash: HashEdge }), []);

  const onEdgeClick = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (event: any, edge: any) => {
      event.stopPropagation();
      setSelectedEdge(edge.id);
    },
    [setSelectedEdge]
  );

  const onNodeClick = useCallback(() => {
    setSelectedEdge(null);
  }, [setSelectedEdge]);

  const onPaneClick = useCallback(() => {
    setSelectedEdge(null);
  }, [setSelectedEdge]);

  const onDeleteSelectedEdge = useCallback(async () => {
    if (!selectedEdge) return;

    const edge = edges.find((e) => e.id === selectedEdge);
    if (!edge || !edge.data?.hash) return;

    const sourceTask = tasks.find((t) => t.id === edge.source);
    const targetTask = tasks.find((t) => t.id === edge.target);
    if (!sourceTask || !targetTask) return;

    if (vault) {
      await removeLinkSignsBetweenTasks(vault, targetTask, sourceTask.id);
      setEdges((eds) => eds.filter((e) => e.id !== selectedEdge));
      setSelectedEdge(null);
    }
  }, [selectedEdge, edges, tasks, vault, setEdges]);

  const onConnect = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (params: any) => {
      const sourceTask = tasks.find((t) => t.id === params.source);
      const targetTask = tasks.find((t) => t.id === params.target);

      if (!vault || !sourceTask || !targetTask) return;

      if (sourceTask.type !== targetTask.type) {
        new Notice(t("errors.cannot_create_edges_different_types"), 5000);
        return;
      }

      const hash = await addLinkSignsBetweenTasks(
        vault,
        sourceTask,
        targetTask,
        settings.linkingStyle
      );
      if (hash) {
        setEdges((eds) =>
          addEdge(
            {
              ...params,
              type: "hash",
              data: {
                hash,
                layoutDirection: settings.layoutDirection,
                debugVisualization: settings.debugVisualization,
              },
            },
            eds
          )
        );
      }
    },
    [
      vault,
      tasks,
      setEdges,
      settings.layoutDirection,
      settings.debugVisualization,
      settings.linkingStyle,
    ]
  );

  // Handle drop of an unlinked task from the sidebar onto the graph canvas
  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const taskId = event.dataTransfer.getData(DRAG_DATA_KEY);
      if (!taskId) return;

      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      // Convert screen coordinates to ReactFlow canvas coordinates
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Store the position so the node appears exactly at the drop point
      droppedNodePositions.current.set(taskId, position);

      // Prevent fitView from zooming out after a sidebar drop
      skipFitViewRef.current = true;

      // Mark task as dropped — triggers graph re-render with the new node
      setDroppedTaskIds((prev) => {
        const next = new Set(prev);
        next.add(taskId);
        return next;
      });
    },
    [tasks, reactFlowInstance]
  );

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const tagsContextValue = useMemo(
    () => ({
      allTags,
      updateTaskTags,
    }),
    [allTags, updateTaskTags]
  );

  const preSearchFilteredTasks = useMemo(() => {
    const filteredIds = getFilteredNodeIds(graphTasks, {
      ...filterState,
      searchQuery: "",
      traversalMode: "match",
    });
    const idSet = new Set(filteredIds);
    return graphTasks.filter((t) => idSet.has(t.id));
  }, [graphTasks, filterState]);

  const filteredTasks = useMemo(() => {
    const filteredIds = getFilteredNodeIds(graphTasks, filterState);
    const idSet = new Set(filteredIds);
    return graphTasks.filter((t) => idSet.has(t.id));
  }, [graphTasks, filterState]);

  const searchResultCount = useMemo(() => {
    if (!filterState.searchQuery.trim()) return null;
    return filteredTasks.length;
  }, [filterState.searchQuery, filteredTasks]);

  const handleSearch = useCallback(
    (query: string): void => {
      setFilterState((prev) => ({ ...prev, searchQuery: query }));
    },
    [setFilterState]
  );

  const handleSavePreset = useCallback(
    async (name: string, filter: FilterState): Promise<void> => {
      await plugin.savePreset(name, filter);
    },
    [plugin]
  );

  const handleRenamePreset = useCallback(
    async (id: string, name: string): Promise<void> => {
      await plugin.renamePreset(id, name);
    },
    [plugin]
  );

  const handleDeletePreset = useCallback(
    async (id: string): Promise<void> => {
      await plugin.deletePreset(id);
    },
    [plugin]
  );

  return (
    <TagsContext.Provider value={tagsContextValue}>
      <div
        className="tasks-map-graph-container"
        ref={containerRef}
        onDrop={onDrop}
        onDragOver={onDragOver}
      >
        {embed.showUnlinkedPanel && hideUnlinkedTasks && (
          <UnlinkedTasksPanel tasks={sidebarTasks} />
        )}
        {isLoading && (
          <div className="tasks-map-loading-container">
            <div className="tasks-map-spinner" />
            <div className="tasks-map-loading-text">Loading tasks...</div>
          </div>
        )}
        {!isLoading && tasks.length === 0 && (
          <GraphEmptyState variant="no_tasks" />
        )}
        {!isLoading && tasks.length > 0 && graphTasks.length === 0 && (
          <GraphEmptyState variant="all_unlinked" />
        )}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          proOptions={{ hideAttribution: true }}
          minZoom={0.1}
          fitView
          onConnect={onConnect}
          onEdgeClick={onEdgeClick}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
        >
          <div className="tasks-map-panels-stack">
            {embed.showPresetsPanel && (
              <FilterPresetsPanel
                presets={settings.filterPresets}
                filterState={filterState}
                plugin={plugin}
                onApply={(filter) => setFilterState(filter)}
                onSave={handleSavePreset}
                onRename={handleRenamePreset}
                onDelete={handleDeletePreset}
              />
            )}
            {embed.showFilterPanel && (
              <GuiOverlay
                allTags={allTags}
                filterState={filterState}
                setFilterState={setFilterState}
                allFiles={allFiles}
                allStatuses={ALL_STATUSES}
                onSearch={handleSearch}
                searchResultCount={searchResultCount}
                suggestionTasks={preSearchFilteredTasks}
              />
            )}
            <ControlsPanel
              showTags={settings.showTags}
              hideTags={hideTags}
              setHideTags={toggleHideTags}
              reloadTasks={reloadTasks}
              showUnlinkedPanel={embed.showUnlinkedPanel}
              hideUnlinkedTasks={hideUnlinkedTasks}
              setHideUnlinkedTasks={setHideUnlinkedTasks}
            />
          </div>
          {embed.showMinimap && <TaskMinimap />}
          <Background />
          {settings.showStatusCounts && embed.showStatusCounts && (
            <StatusCountsOverlay tasks={filteredTasks} />
          )}
        </ReactFlow>
        {selectedEdge && <DeleteEdgeButton onDelete={onDeleteSelectedEdge} />}
      </div>
    </TagsContext.Provider>
  );
}
