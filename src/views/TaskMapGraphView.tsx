import React, { useEffect, useCallback, useMemo } from "react";
import ReactFlow, {
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  ReactFlowProvider,
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

// Inner component that uses ReactFlow hooks (must be inside ReactFlowProvider)
interface TaskMapGraphInnerProps {
  settings: TasksMapSettings;
  tasks: Task[];
  selectedTags: string[];
  selectedStatuses: TaskStatus[];
  setSelectedTags: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedStatuses: React.Dispatch<React.SetStateAction<TaskStatus[]>>;
  reloadTasks: () => void;
  allTags: string[];
  updateTaskTags: (taskId: string, newTags: string[]) => void;
}

function TaskMapGraphInner({
  settings,
  tasks,
  selectedTags,
  selectedStatuses,
  setSelectedTags,
  setSelectedStatuses,
  reloadTasks,
  allTags,
  updateTaskTags,
}: TaskMapGraphInnerProps) {
  const app = useApp();
  const vault = app.vault;
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedEdge, setSelectedEdge] = React.useState<string | null>(null);
  const reactFlowInstance = useReactFlow();

  useEffect(() => {
    new Notice("Updating graph...", 1000);
    let newNodes = createNodesFromTasks(
      tasks,
      settings.layoutDirection,
      settings.showPriorities,
      settings.showTags,
      settings.debugVisualization,
      settings.tagColorMode,
      settings.tagColorSeed,
      settings.tagStaticColor
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
      settings.layoutDirection
    );

    setNodes(layoutedNodes);
    setEdges(newEdges);

    setTimeout(() => {
      reactFlowInstance.fitView({ duration: 400 });
    }, 1000);
  }, [
    tasks,
    selectedTags,
    selectedStatuses,
    settings,
    reactFlowInstance,
    setNodes,
    setEdges,
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
      <div className="tasks-map-graph-container">
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
          />
          <TaskMinimap />
          <Background />
        </ReactFlow>
        {selectedEdge && <DeleteEdgeButton onDelete={onDeleteSelectedEdge} />}
      </div>
    </TagsContext.Provider>
  );
}

// Outer component that manages filter state and keys the ReactFlowProvider
export default function TaskMapGraphView({ settings }: TaskMapGraphViewProps) {
  const app = useApp();
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = React.useState<TaskStatus[]>([
    ...ALL_STATUSES,
  ]);

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

  const reloadTasks = useCallback(() => {
    const newTasks = getAllTasks(app);
    setTasks(newTasks);
    const newRegistry = new Map<string, string[]>();
    newTasks.forEach((task) => {
      newRegistry.set(task.id, task.tags);
    });
    setTaskTagsRegistry(newRegistry);
    new Notice("Tasks reloaded");
  }, [app]);

  const updateTaskTags = useCallback((taskId: string, newTags: string[]) => {
    setTaskTagsRegistry((prevRegistry) => {
      const newRegistry = new Map(prevRegistry);
      newRegistry.set(taskId, newTags);
      return newRegistry;
    });
  }, []);

  useEffect(() => {
    // Wait for a short moment to ensure vault is ready
    const timeoutId = window.setTimeout(() => {
      reloadTasks();
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [reloadTasks]);

  // Update tag registry when tasks change
  useEffect(() => {
    const newRegistry = new Map<string, string[]>();
    tasks.forEach((task) => {
      newRegistry.set(task.id, task.tags);
    });
    setTaskTagsRegistry(newRegistry);
  }, [tasks]);

  // Key the ReactFlowProvider on filter state to force complete remount
  const providerKey = useMemo(
    () => `${selectedTags.join(",")}-${selectedStatuses.join(",")}`,
    [selectedTags, selectedStatuses]
  );

  return (
    <ReactFlowProvider key={providerKey}>
      <TaskMapGraphInner
        settings={settings}
        tasks={tasks}
        selectedTags={selectedTags}
        selectedStatuses={selectedStatuses}
        setSelectedTags={setSelectedTags}
        setSelectedStatuses={setSelectedStatuses}
        reloadTasks={reloadTasks}
        allTags={allTags}
        updateTaskTags={updateTaskTags}
      />
    </ReactFlowProvider>
  );
}
