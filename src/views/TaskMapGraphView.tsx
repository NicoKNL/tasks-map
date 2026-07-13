import React, { useEffect, useCallback, useMemo, useRef } from "react";
import ReactFlow, {
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  type NodeDragHandler,
  type SelectionDragHandler,
} from "reactflow";
import { Notice } from "obsidian";
import { useApp } from "src/hooks/hooks";
import {
  addLinkSignsBetweenTasks,
  addSignToTaskInFile,
  getAllTasks,
  getLayoutedElements,
  removeLinkSignsBetweenTasks,
  createNodesFromTasks,
  createEdgesFromTasks,
  getUnlinkedTasks,
  addTaskLineToVault,
  deleteTaskFromVault,
  getTasksApi,
  parseTaskLine,
} from "src/lib/utils";
import { BaseTask } from "src/types/task";
import { NoteTask } from "src/types/note-task";
import GuiOverlay from "src/components/gui-overlay";
import FilterPresetsPanel from "src/components/filter-presets-panel";
import StatusCountsOverlay from "src/components/status-counts-overlay";
import TaskNode from "src/components/task-node";
import ProjectGroupNode from "src/components/project-group-node";
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
import { TaskInsertPosition } from "src/types/base-task";

const ALL_STATUSES: TaskStatus[] = ["todo", "in_progress", "done", "canceled"];

interface TaskMapGraphViewProps {
  settings: TasksMapSettings;
  filterState: FilterState;
  setFilterState: React.Dispatch<React.SetStateAction<FilterState>>;
  plugin: TasksMapPlugin;
  embedConfig?: EmbedConfig;
  reloadRef?: React.MutableRefObject<(() => void) | null>;
}

interface ReloadTasksOptions {
  preserveViewport?: boolean;
}

export default function TaskMapGraphView({
  settings,
  filterState,
  setFilterState,
  plugin,
  embedConfig,
  reloadRef,
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
  const connectStartRef = React.useRef<{
    nodeId: string;
    handleType: "source" | "target";
  } | null>(null);

  const [hideTags, setHideTags] = React.useState(embed.hideTagsOnNodes);
  const [hideUnlinkedTasks, setHideUnlinkedTasks] = React.useState(
    embed.hideUnlinkedTasks
  );
  const [groupByProject, setGroupByProject] = React.useState(true);
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
        containerRef.current.classList.add("tasks-map--hide-tags");
      } else {
        containerRef.current.classList.remove("tasks-map--hide-tags");
      }
    }
  }, [hideTags]);

  const reloadTasks = useCallback(
    ({ preserveViewport = false }: ReloadTasksOptions = {}) => {
      setIsLoading(true);
      // Use setTimeout to allow the loading UI to render before heavy computation
      window.setTimeout(() => {
        if (preserveViewport) {
          skipFitViewRef.current = true;
        }
        // Reset dropped state on reload so unlinked tasks return to sidebar
        setDroppedTaskIds(new Set());
        droppedNodePositions.current = new Map();
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
    },
    [app]
  );

  const handleReloadTasks = useCallback(() => {
    reloadTasks({ preserveViewport: true });
  }, [reloadTasks]);

  useEffect(() => {
    if (reloadRef) {
      reloadRef.current = handleReloadTasks;
    }
  }, [reloadRef, handleReloadTasks]);

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

  const handleTaskEdited = useCallback(
    (taskId: string, updatedTask: BaseTask) => {
      skipFitViewRef.current = true;
      setTasks((prevTasks) =>
        prevTasks.map((task) => (task.id === taskId ? updatedTask : task))
      );
      setTaskTagsRegistry((prevRegistry) => {
        const newRegistry = new Map(prevRegistry);
        if (taskId !== updatedTask.id) {
          newRegistry.delete(taskId);
        }
        newRegistry.set(updatedTask.id, updatedTask.tags);
        return newRegistry;
      });

      if (taskId === updatedTask.id) return;

      setDroppedTaskIds((prevDroppedTaskIds) => {
        if (!prevDroppedTaskIds.has(taskId)) {
          return prevDroppedTaskIds;
        }

        const nextDroppedTaskIds = new Set(prevDroppedTaskIds);
        nextDroppedTaskIds.delete(taskId);
        nextDroppedTaskIds.add(updatedTask.id);
        return nextDroppedTaskIds;
      });

      const droppedPosition = droppedNodePositions.current.get(taskId);
      if (droppedPosition) {
        droppedNodePositions.current.delete(taskId);
        droppedNodePositions.current.set(updatedTask.id, droppedPosition);
      }
    },
    []
  );

  useEffect(() => {
    // Get the Dataview plugin to check index status
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Obsidian App type does not expose plugins property
    const dataviewPlugin = (app as any).plugins?.plugins?.["dataview"];

    // Check if Dataview index is already initialized
    if (dataviewPlugin?.index?.initialized) {
      // Index already ready, load tasks immediately
      reloadTasks();
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Obsidian App type does not expose metadataCache events
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
      handleDeleteTask,
      groupByProject,
      settings.tagColorPalette,
      handleTaskEdited
    );
    let newEdges = createEdgesFromTasks(
      graphTasks,
      settings.layoutDirection,
      settings.debugVisualization,
      settings.edgeStyle,
      settings.smoothStepRadius
    );

    const filteredNodeIds = getFilteredNodeIds(graphTasks, filterState);
    const filteredTasks = graphTasks.filter((t) =>
      filteredNodeIds.includes(t.id)
    );

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
      settings.showTags,
      groupByProject,
      filteredTasks
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
      window.setTimeout(() => {
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
    handleTaskEdited,
    droppedTaskIds,
    groupByProject,
  ]);

  const nodeTypes = useMemo(
    () => ({ task: TaskNode, projectGroup: ProjectGroupNode }),
    []
  );
  const edgeTypes = useMemo(() => ({ hash: HashEdge }), []);

  // Show the "group by project" toggle only when at least one task has a project
  const showGroupByProject = useMemo(
    () => tasks.some((t) => t.projects.length > 0),
    [tasks]
  );

  const onEdgeClick = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ReactFlow event/edge types lack exported union
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

  const createUpdatedTask = useCallback(
    (task: BaseTask, incomingLinks: string[]) =>
      Object.assign(Object.create(Object.getPrototypeOf(task)), task, {
        incomingLinks,
      }) as BaseTask,
    []
  );

  const updateTaskIncomingLinks = useCallback(
    (
      taskId: string,
      updateIncomingLinks: (_incomingLinks: string[]) => string[]
    ) => {
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId
            ? createUpdatedTask(
                task,
                updateIncomingLinks(task.incomingLinks)
              )
            : task
        )
      );
    },
    [createUpdatedTask]
  );

  const onDeleteSelectedEdge = useCallback(async () => {
    if (!selectedEdge) return;

    const edge = edges.find((e) => e.id === selectedEdge);
    if (!edge || !edge.data?.hash) return;

    const sourceTask = tasks.find((t) => t.id === edge.source);
    const targetTask = tasks.find((t) => t.id === edge.target);
    if (!sourceTask || !targetTask) return;

    if (vault) {
      await removeLinkSignsBetweenTasks(vault, targetTask, sourceTask.id);
      skipFitViewRef.current = true;
      updateTaskIncomingLinks(targetTask.id, (incomingLinks) =>
        incomingLinks.filter((id) => id !== sourceTask.id)
      );
      setEdges((eds) => eds.filter((e) => e.id !== selectedEdge));
      setSelectedEdge(null);
    }
  }, [
    selectedEdge,
    edges,
    tasks,
    vault,
    setEdges,
    updateTaskIncomingLinks,
  ]);

  const onConnect = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ReactFlow Connection type is not exported
    async (params: any) => {
      // Reset so onConnectEnd (which fires after onConnect) does not
      // misinterpret this as a canvas-drop and open the create modal.
      connectStartRef.current = null;

      const sourceTask = tasks.find((t) => t.id === params.source);
      const targetTask = tasks.find((t) => t.id === params.target);

      if (!vault || !sourceTask || !targetTask) return;

      if (targetTask.incomingLinks.includes(sourceTask.id)) {
        return;
      }

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
        skipFitViewRef.current = true;
        updateTaskIncomingLinks(targetTask.id, (incomingLinks) =>
          incomingLinks.includes(sourceTask.id)
            ? incomingLinks
            : [...incomingLinks, sourceTask.id]
        );
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
      updateTaskIncomingLinks,
      settings.layoutDirection,
      settings.debugVisualization,
      settings.linkingStyle,
    ]
  );

  const createConnectedTask = useCallback(
    async (
      anchorTask: BaseTask,
      position: TaskInsertPosition,
      relation: "before" | "after"
    ) => {
      if (!vault || anchorTask.type !== "dataview") {
        return;
      }

      const tasksApi = getTasksApi(app);
      if (!tasksApi) {
        console.error("Tasks plugin not found or API not available");
        return;
      }

      const taskLine = await tasksApi.createTaskLineModal();
      if (!taskLine?.trim()) {
        return;
      }

      const newTask = parseTaskLine(taskLine, anchorTask.link);
      if (!newTask || newTask.type !== anchorTask.type) {
        return;
      }

      try {
        await addTaskLineToVault(anchorTask, taskLine, app, position);

        // Persist the in-memory ID into the newly written task line so that
        // all subsequent vault lookups (addLinkSignsBetweenTasks, rollback
        // deleteTaskFromVault) can find the line by ID rather than falling
        // back to an ambiguous text-match.
        await addSignToTaskInFile(
          vault,
          newTask,
          "id",
          newTask.id,
          settings.linkingStyle
        );

        if (relation === "after") {
          await addLinkSignsBetweenTasks(
            vault,
            anchorTask,
            newTask,
            settings.linkingStyle
          );
        } else {
          await addLinkSignsBetweenTasks(
            vault,
            newTask,
            anchorTask,
            settings.linkingStyle
          );
        }

        skipFitViewRef.current = true;
        setTasks((prevTasks) => {
          const nextTasks =
            relation === "after"
              ? prevTasks
              : prevTasks.map((task) =>
                  task.id === anchorTask.id
                    ? createUpdatedTask(task, [
                        ...task.incomingLinks,
                        newTask.id,
                      ])
                    : task
                );

          const taskToAdd =
            relation === "after"
              ? createUpdatedTask(newTask, [
                  ...newTask.incomingLinks,
                  anchorTask.id,
                ])
              : newTask;

          return [...nextTasks, taskToAdd];
        });
      } catch (error) {
        console.error("Failed to create connected task:", error);

        try {
          await deleteTaskFromVault(newTask, app);
        } catch (rollbackError) {
          console.error("Failed to rollback created task:", rollbackError);
        }
      }
    },
    [app, createUpdatedTask, settings.linkingStyle, vault]
  );

  const onConnectStart = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ReactFlow OnConnectStartParams type is not exported
    (_event: any, params: any) => {
      if (!params?.nodeId || !params?.handleType) {
        connectStartRef.current = null;
        return;
      }

      connectStartRef.current = {
        nodeId: params.nodeId,
        handleType: params.handleType,
      };
    },
    []
  );

  const onConnectEnd = useCallback(
    async (event: MouseEvent | TouchEvent) => {
      const connectStart = connectStartRef.current;
      connectStartRef.current = null;

      if (!connectStart) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const endedOnHandle = target.closest(".react-flow__handle");
      const endedOnNode = target.closest(".react-flow__node");
      const endedOnCanvas = target.closest(
        ".react-flow__pane, .react-flow__background"
      );

      if (endedOnHandle || endedOnNode || !endedOnCanvas) {
        return;
      }

      const anchorTask = tasks.find((task) => task.id === connectStart.nodeId);
      if (!anchorTask) {
        return;
      }

      if (connectStart.handleType === "source") {
        await createConnectedTask(anchorTask, "after", "after");
      } else {
        await createConnectedTask(anchorTask, "before", "before");
      }
    },
    [createConnectedTask, tasks]
  );

  // Returns the project group node id that contains the given position, or null
  const findGroupAtPosition = useCallback(
    (pos: { x: number; y: number }): string | null => {
      for (const groupNode of nodes.filter((n) => n.type === "projectGroup")) {
        const { x, y } = groupNode.position;
        const w =
          groupNode.width ??
          (groupNode.style?.width as number | undefined) ??
          0;
        const h =
          groupNode.height ??
          (groupNode.style?.height as number | undefined) ??
          0;
        if (pos.x >= x && pos.x <= x + w && pos.y >= y && pos.y <= y + h) {
          return groupNode.id;
        }
      }
      return null;
    },
    [nodes]
  );

  // Update isDragOver highlights for project group nodes based on a set of drag positions.
  // Groups whose IDs appear in excludeGroupIds are never highlighted (used to suppress
  // highlighting the group a node already belongs to).
  const updateDragOverHighlights = useCallback(
    (
      positions: { x: number; y: number }[],
      excludeGroupIds: Set<string> = new Set()
    ) => {
      const hoveredGroupIds = new Set(
        positions
          .map((pos) => findGroupAtPosition(pos))
          .filter((id): id is string => id !== null && !excludeGroupIds.has(id))
      );
      setNodes((nds) =>
        nds.map((n) => {
          if (n.type !== "projectGroup") return n;
          const isDragOver = hoveredGroupIds.has(n.id);
          if ((n.data as { isDragOver?: boolean }).isDragOver === isDragOver)
            return n;
          return { ...n, data: { ...n.data, isDragOver } };
        })
      );
    },
    [findGroupAtPosition, setNodes]
  );

  // Highlight project group node while a task node is dragged over it
  const onNodeDrag: NodeDragHandler = useCallback(
    (_event, draggedNode) => {
      if (draggedNode.type !== "task") return;
      const dragPos = draggedNode.positionAbsolute ?? draggedNode.position;
      // Prefer parentNode from current nodes state — ReactFlow 11 may not populate
      // parentId reliably on the drag-event node snapshot.
      const currentNode = nodes.find((n) => n.id === draggedNode.id);
      const parentNodeId = currentNode?.parentNode ?? draggedNode.parentId;
      const excludeGroupIds = new Set(parentNodeId ? [parentNodeId] : []);
      updateDragOverHighlights([dragPos], excludeGroupIds);
    },
    [updateDragOverHighlights, nodes]
  );

  // Highlight project group nodes while multiple selected task nodes are dragged
  const onSelectionDrag: SelectionDragHandler = useCallback(
    (_event, draggedNodes) => {
      const taskNodes = draggedNodes.filter((n) => n.type === "task");
      const positions = taskNodes.map((n) => n.positionAbsolute ?? n.position);
      const excludeGroupIds = new Set(
        taskNodes
          .map((n) => {
            const currentNode = nodes.find((cn) => cn.id === n.id);
            return currentNode?.parentNode ?? n.parentId;
          })
          .filter((id): id is string => !!id)
      );
      updateDragOverHighlights(positions, excludeGroupIds);
    },
    [updateDragOverHighlights, nodes]
  );

  // Clear all drag-over highlights on project group nodes
  const clearDragOverHighlights = useCallback(() => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.type !== "projectGroup") return n;
        if (!(n.data as { isDragOver?: boolean }).isDragOver) return n;
        return { ...n, data: { ...n.data, isDragOver: false } };
      })
    );
  }, [setNodes]);

  // Assign a list of task nodes to the project group they were dropped into.
  // For a multi-node selection, any single node overlapping a group is enough
  // to assign the entire selection to that group.
  const assignDraggedNodesToProject = useCallback(
    async (
      draggedNodes: {
        id: string;
        type?: string;
        position: { x: number; y: number };
        positionAbsolute?: { x: number; y: number };
      }[]
    ) => {
      const taskNodes = draggedNodes.filter((n) => n.type === "task");
      if (taskNodes.length === 0) return;

      // Find the first group that any dragged node overlaps
      let targetProjectName: string | null = null;
      for (const draggedNode of taskNodes) {
        const dragPos = draggedNode.positionAbsolute ?? draggedNode.position;
        const groupId = findGroupAtPosition(dragPos);
        if (!groupId) continue;
        const groupNode = nodes.find((n) => n.id === groupId);
        if (!groupNode) continue;
        targetProjectName = (groupNode.data as { label: string }).label;
        break;
      }

      if (!targetProjectName) return;

      // Assign all task nodes in the selection to that project, skipping any
      // that already belong to the target group.
      const targetGroupId = `project-group-${targetProjectName}`;
      let count = 0;
      for (const draggedNode of taskNodes) {
        const currentNode = nodes.find((n) => n.id === draggedNode.id);
        if (currentNode?.parentNode === targetGroupId) continue;
        const task = tasks.find((t) => t.id === draggedNode.id);
        if (!(task instanceof NoteTask)) continue;
        await task.addProject(app, targetProjectName);
        count++;
      }

      if (count === 1) {
        new Notice(
          t("notices.project_assigned", { projectName: targetProjectName })
        );
      } else if (count > 1) {
        new Notice(
          t("notices.project_assigned_multiple", {
            projectName: targetProjectName,
            count,
          })
        );
      }
    },
    [tasks, nodes, app, findGroupAtPosition]
  );

  // Handle drag-stop of a graph task node — assign to project if dropped inside a group
  const onNodeDragStop: NodeDragHandler = useCallback(
    (_event, draggedNode) => {
      clearDragOverHighlights();
      // eslint-disable-next-line @typescript-eslint/no-floating-promises -- NodeDragHandler expects void; async work is intentionally fire-and-forget
      assignDraggedNodesToProject([draggedNode]);
    },
    [clearDragOverHighlights, assignDraggedNodesToProject]
  );

  // Handle drag-stop of a multi-node selection — assign all task nodes to projects
  const onSelectionDragStop: SelectionDragHandler = useCallback(
    (_event, draggedNodes) => {
      clearDragOverHighlights();
      // eslint-disable-next-line @typescript-eslint/no-floating-promises -- SelectionDragHandler expects void; async work is intentionally fire-and-forget
      assignDraggedNodesToProject(draggedNodes);
    },
    [clearDragOverHighlights, assignDraggedNodesToProject]
  );

  // Handle drop of an unlinked task from the sidebar onto the graph canvas
  const onDrop = useCallback(
    async (event: React.DragEvent<HTMLDivElement>) => {
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

      // Check if drop landed inside a project group node
      if (task instanceof NoteTask) {
        const projectGroupNodes = nodes.filter(
          (n) => n.type === "projectGroup"
        );
        for (const groupNode of projectGroupNodes) {
          const { x, y } = groupNode.position;
          const w =
            groupNode.width ??
            (groupNode.style?.width as number | undefined) ??
            0;
          const h =
            groupNode.height ??
            (groupNode.style?.height as number | undefined) ??
            0;
          if (
            position.x >= x &&
            position.x <= x + w &&
            position.y >= y &&
            position.y <= y + h
          ) {
            const projectName = (groupNode.data as { label: string }).label;
            await task.addProject(app, projectName);
            new Notice(t("notices.project_assigned", { projectName }));
            break;
          }
        }
      }

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
    [tasks, reactFlowInstance, nodes, app]
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
        onDrop={(e) => void onDrop(e)}
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
          onConnect={(params) => void onConnect(params)}
          onConnectStart={onConnectStart}
          onConnectEnd={(e) => void onConnectEnd(e)}
          onEdgeClick={onEdgeClick}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onNodeDrag={onNodeDrag}
          onNodeDragStop={(e, node, nodes) =>
            void onNodeDragStop(e, node, nodes)
          }
          onSelectionDrag={onSelectionDrag}
          onSelectionDragStop={(e, nodes) => void onSelectionDragStop(e, nodes)}
          multiSelectionKeyCode="Shift"
          selectionKeyCode="Shift"
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
            {embed.showViewPanel && (
              <ControlsPanel
                showTags={settings.showTags}
                hideTags={hideTags}
                setHideTags={toggleHideTags}
                reloadTasks={handleReloadTasks}
                showUnlinkedPanel={embed.showUnlinkedPanel}
                hideUnlinkedTasks={hideUnlinkedTasks}
                setHideUnlinkedTasks={setHideUnlinkedTasks}
                showGroupByProject={showGroupByProject}
                groupByProject={groupByProject}
                setGroupByProject={setGroupByProject}
              />
            )}
          </div>
          {embed.showMinimap && <TaskMinimap />}
          <Background />
          {settings.showStatusCounts && embed.showStatusCounts && (
            <StatusCountsOverlay tasks={filteredTasks} />
          )}
        </ReactFlow>
        {selectedEdge && (
          <DeleteEdgeButton onDelete={() => void onDeleteSelectedEdge()} />
        )}
      </div>
    </TagsContext.Provider>
  );
}
