import React, { useEffect, useCallback, useMemo } from "react";
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
} from "src/lib/utils";
import { Task } from "src/types/task";
import GuiOverlay from "src/components/gui-overlay";
import TaskNode from "src/components/task-node";
import { NO_TAGS_VALUE } from "src/components/tag-select";
import { TaskMinimap } from "src/components/task-minimap";
import HashEdge from "src/components/hash-edge";
import { DeleteEdgeButton } from "src/components/delete-edge-button";
import { TagsContext } from "src/contexts/context";

import { TaskStatus } from "src/types/task";
import { TasksMapSettings } from "src/types/settings";

const ALL_STATUSES: TaskStatus[] = ["todo", "in_progress", "done", "canceled"];

interface TaskMapGraphViewProps {
  settings: TasksMapSettings;
  selectedTags: string[];
  setSelectedTags: React.Dispatch<React.SetStateAction<string[]>>;
  selectedStatuses: TaskStatus[];
  setSelectedStatuses: React.Dispatch<React.SetStateAction<TaskStatus[]>>;
}

// Helper function to filter tasks
const getFilteredNodeIds = (
  tasks: Task[],
  selectedTags: string[],
  selectedStatuses: TaskStatus[]
) => {
  let filtered = tasks;
  if (selectedTags.length > 0) {
    filtered = filtered.filter((task) => {
      const noTagsSelected = selectedTags.includes(NO_TAGS_VALUE);
      const regularTagsSelected = selectedTags.filter(
        (tag) => tag !== NO_TAGS_VALUE
      );
      const matchesNoTags = noTagsSelected && task.tags.length === 0;
      const matchesRegularTags =
        regularTagsSelected.length > 0 &&
        regularTagsSelected.some((tag) => task.tags.includes(tag));
      return matchesNoTags || matchesRegularTags;
    });
  }
  if (selectedStatuses.length > 0) {
    filtered = filtered.filter((task) =>
      selectedStatuses.includes(task.status)
    );
  }
  return filtered.map((task) => task.id);
};

export default function TaskMapGraphView({
  settings,
  selectedTags,
  setSelectedTags,
  selectedStatuses,
  setSelectedStatuses,
}: TaskMapGraphViewProps) {
  const app = useApp();
  const vault = app.vault;
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [selectedEdge, setSelectedEdge] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const reactFlowInstance = useReactFlow();
  const skipFitViewRef = React.useRef(false);

  // 添加标签隐藏状态
  const [hideTags, setHideTags] = React.useState(false);
  // 创建容器ref
  const containerRef = React.useRef<HTMLDivElement>(null);

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

  // 动态添加/移除CSS类
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

  useEffect(() => {
    let newNodes = createNodesFromTasks(
      tasks,
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
      tasks,
      settings.layoutDirection,
      settings.debugVisualization
    );

    const filteredNodeIds = getFilteredNodeIds(
      tasks,
      selectedTags,
      selectedStatuses
    );

    newNodes = newNodes.filter((n) => filteredNodeIds.includes(n.id));
    newEdges = newEdges.filter(
      (e) =>
        filteredNodeIds.includes(e.source) && filteredNodeIds.includes(e.target)
    );

    const layoutedNodes = getLayoutedElements(
      newNodes,
      newEdges,
      settings.layoutDirection,
      settings.showTags
    );

    setNodes(layoutedNodes);
    setEdges(newEdges);

    if (skipFitViewRef.current) {
      skipFitViewRef.current = false;
    } else {
      setTimeout(() => {
        reactFlowInstance.fitView({ duration: 400 });
      }, 1000);
    }
  }, [
    tasks,
    selectedTags,
    selectedStatuses,
    settings,
    reactFlowInstance,
    setNodes,
    setEdges,
    handleDeleteTask,
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
        new Notice(
          "Cannot create edges between different task types (dataview and note-based tasks). Both tasks must be of the same type.",
          5000
        );
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

  const tagsContextValue = useMemo(
    () => ({
      allTags,
      updateTaskTags,
    }),
    [allTags, updateTaskTags]
  );

  return (
    <TagsContext.Provider value={tagsContextValue}>
      {}
      <div className="tasks-map-graph-container" ref={containerRef}>
        {isLoading && (
          <div className="tasks-map-loading-container">
            <div className="tasks-map-spinner" />
            <div className="tasks-map-loading-text">Loading tasks...</div>
          </div>
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
          <GuiOverlay
            allTags={allTags}
            selectedTags={selectedTags}
            setSelectedTags={setSelectedTags}
            reloadTasks={reloadTasks}
            allStatuses={ALL_STATUSES}
            selectedStatuses={selectedStatuses}
            setSelectedStatuses={setSelectedStatuses}
            showTags={settings.showTags}
            hideTags={hideTags}
            setHideTags={setHideTags}
          />
          <TaskMinimap />
          <Background />
        </ReactFlow>
        {selectedEdge && <DeleteEdgeButton onDelete={onDeleteSelectedEdge} />}
      </div>
    </TagsContext.Provider>
  );
}
