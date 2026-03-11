import React, { useEffect, useCallback, useMemo } from "react";
import ReactFlow, {
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  OnConnectStartParams,
} from "reactflow";
import { Notice } from "obsidian";
import { useApp } from "src/hooks/hooks";
import TasksMapPlugin from "../main";
import {
  addLinkSignsBetweenTasks,
  getAllTasks,
  getLayoutedElements,
  removeLinkSignsBetweenTasks,
  createNodesFromTasks,
  createEdgesFromTasks,
  addIsolatedTaskLineToVault,
  findRelatedTaskIds,
} from "src/lib/utils";
import { BaseTask, RawTask } from "src/types/task";
import GuiOverlay from "src/components/gui-overlay";
import TaskNode, { NODEWIDTH, NODEHEIGHT } from "src/components/task-node";
import { NO_TAGS_VALUE } from "src/components/tag-select";
import { TaskMinimap } from "src/components/task-minimap";
import HashEdge from "src/components/hash-edge";
import { DeleteEdgeButton } from "src/components/delete-edge-button";
import { TagsContext } from "src/contexts/context";
import { t } from "../i18n";

import { TaskStatus } from "src/types/task";
import { TasksMapSettings } from "src/types/settings";
import { TaskFactory } from "../lib/task-factory";
import { AIService } from "../lib/ai-service";
import { BatchAIService } from "../lib/batch-ai-service";

const ALL_STATUSES: TaskStatus[] = ["todo", "in_progress", "done", "canceled"];

interface TaskMapGraphViewProps {
  settings: TasksMapSettings;
  selectedTags: string[];
  setSelectedTags: React.Dispatch<React.SetStateAction<string[]>>;
  excludedTags: string[];
  setExcludedTags: React.Dispatch<React.SetStateAction<string[]>>;
  selectedStatuses: TaskStatus[];
  setSelectedStatuses: React.Dispatch<React.SetStateAction<TaskStatus[]>>;
  selectedFiles: string[];
  setSelectedFiles: React.Dispatch<React.SetStateAction<string[]>>;
}

// Helper function to filter tasks
const getFilteredNodeIds = (
  tasks: BaseTask[],
  selectedTags: string[],
  selectedStatuses: TaskStatus[],
  excludedTags: string[],
  selectedFiles: string[]
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
  if (excludedTags.length > 0) {
    filtered = filtered.filter((task) => {
      // Exclude tasks that have any of the excluded tags
      return !excludedTags.some((excludedTag) =>
        task.tags.includes(excludedTag)
      );
    });
  }
  if (selectedStatuses.length > 0) {
    filtered = filtered.filter((task) =>
      selectedStatuses.includes(task.status)
    );
  }
  if (selectedFiles.length > 0) {
    filtered = filtered.filter((task) => {
      // Check if task's file path matches any selected file/folder
      return selectedFiles.some((selectedPath) => {
        // If selectedPath ends with /, it's a folder filter
        if (selectedPath.endsWith("/")) {
          return task.link.startsWith(selectedPath);
        }
        // Otherwise it's an exact file match
        return task.link === selectedPath;
      });
    });
  }
  return filtered.map((task) => task.id);
};

export default function TaskMapGraphView({
  settings,
  selectedTags,
  setSelectedTags,
  excludedTags,
  setExcludedTags,
  selectedStatuses,
  setSelectedStatuses,
  selectedFiles,
  setSelectedFiles,
}: TaskMapGraphViewProps) {
  const app = useApp();
  const vault = app.vault;

  // 获取插件实例以更新过滤状态
  const plugin = React.useMemo(() => {
    return (
      app as unknown as {
        plugins: { plugins: Record<string, TasksMapPlugin> };
      }
    ).plugins.plugins["tasks-map"] as TasksMapPlugin;
  }, [app]);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [tasks, setTasks] = React.useState<BaseTask[]>([]);
  const [selectedEdge, setSelectedEdge] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const reactFlowInstance = useReactFlow();
  const connectionStartHandleRef = React.useRef<{
    nodeId: string | null;
    handleId: string | null;
    handleType: "source" | "target" | null;
  } | null>(null);
  const skipFitViewRef = React.useRef(false);

  const [hideTags, setHideTags] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

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

  const handleAiNext = useCallback(async (taskId: string) => {
    // Find all related tasks (recursively through dependencies)
    const relatedTaskIds = findRelatedTaskIds(tasks, taskId);
    // Remove the current task from related tasks (we'll treat it separately)
    relatedTaskIds.delete(taskId);
    console.info('Related task IDs:', Array.from(relatedTaskIds));
    // Get the current task
    const currentTask = tasks.find(t => t.id === taskId);
    if (!currentTask) {
      new Notice("Current task not found");
      return;
    }

    // Get related tasks
    const relatedTasks = Array.from(relatedTaskIds)
      .map(id => tasks.find(t => t.id === id))
      .filter((task): task is BaseTask => task !== undefined)
      .map(task => task.text);

    console.info(relatedTasks);

    // Check if AI is enabled and configured
    if (!settings.aiEnabled) {
      new Notice("AI integration is not enabled. Please enable it in settings.");
      return;
    }

    if (!settings.aiApiKey.trim()) {
      new Notice("API key is required for AI integration.");
      return;
    }

    try {
      const maxTasks = settings.aiMaxGeneratedTasks || 1;
      let results = await BatchAIService.predictBatchTasks({
        currentTask: currentTask.text,
        relatedTasks,
        settings,
        count: maxTasks,
      });

      // Filter out tasks that already exist in related tasks (including current task)
      const existingTaskTexts = new Set([currentTask.text, ...relatedTasks]);
      results = results.filter(result => !existingTaskTexts.has(result));

      if (results.length === 0) {
        new Notice("AI generated tasks already exist among related tasks. No new tasks created.");
        return;
      }

      // @ts-ignore
      const tasksPlugin = app.plugins.plugins["obsidian-tasks-plugin"];
      if (!tasksPlugin?.apiV1) {
        new Notice("Tasks plugin not found");
        return;
      }
      const tasksApi = tasksPlugin.apiV1;

      // Parse task types (S: sequential, P: parallel)
      const parsedTasks = results.map(result => {
        let type: 'sequential' | 'parallel' = 'parallel';
        let text = result.trim();
        if (text.startsWith('S:')) {
          type = 'sequential';
          text = text.substring(2).trim();
        } else if (text.startsWith('P:')) {
          type = 'parallel';
          text = text.substring(2).trim();
        }
        // Remove any other potential prefixes like numbers, bullets
        text = text.replace(/^[-*•]\s*/, '').replace(/^\d+\.\s*/, '');
        return { text, type };
      });

      // Filter out empty texts
      const validTasks = parsedTasks.filter(task => task.text.length > 0);

      // Create task lines
      const taskLines = validTasks.map(task => `- [ ] ${task.text}`);

      // Track the last task for sequential chain
      let lastSequentialTask = currentTask;

      for (let i = 0; i < validTasks.length; i++) {
        const task = validTasks[i];
        const taskLine = taskLines[i];

        // Add to inbox
        await addIsolatedTaskLineToVault(taskLine, settings.taskInbox, app);

        // Create edge based on task type
        const factory = new TaskFactory();
        const rawTask: RawTask = {
          status: "todo",
          text: taskLine,
          link: {
            path: settings.taskInbox,
          },
        };
        const newTask = factory.parse(rawTask, "dataview");

        if (task.type === 'sequential') {
          // Create edge from last sequential task to new task
          await addLinkSignsBetweenTasks(
            vault,
            lastSequentialTask,
            newTask,
            settings.linkingStyle
          );
          // Update last sequential task
          lastSequentialTask = newTask;
        } else {
          // Parallel: create edge from current task to new task
          await addLinkSignsBetweenTasks(
            vault,
            currentTask,
            newTask,
            settings.linkingStyle
          );
        }
      }

      new Notice(`Created ${results.length} next task(s) successfully!`);

      // Reload tasks to refresh the graph
      setTimeout(() => {
        reloadTasks();
      }, 200);

    } catch (error) {
      console.error("AI next task prediction failed:", error);
      const message = error instanceof Error ? error.message : String(error);
      new Notice(`Failed to create next task: ${message}`);
    }
    }, [tasks, settings, app, vault, reloadTasks]);

  const handleAiBefore = useCallback(async (taskId: string) => {
    // Find all related tasks (recursively through dependencies)
    const relatedTaskIds = findRelatedTaskIds(tasks, taskId);
    // Remove the current task from related tasks (we'll treat it separately)
    relatedTaskIds.delete(taskId);
    console.info('Related task IDs:', Array.from(relatedTaskIds));
    // Get the current task
    const currentTask = tasks.find(t => t.id === taskId);
    if (!currentTask) {
      new Notice("Current task not found");
      return;
    }

    // Get related tasks
    const relatedTasks = Array.from(relatedTaskIds)
      .map(id => tasks.find(t => t.id === id))
      .filter((task): task is BaseTask => task !== undefined)
      .map(task => task.text);

    console.info(relatedTasks);

    // Check if AI is enabled and configured
    if (!settings.aiEnabled) {
      new Notice(
        "AI integration is not enabled. Please enable it in settings."
      );
      return;
    }

    if (!settings.aiApiKey.trim()) {
      new Notice("API key is required for AI integration.");
      return;
    }

    try {
      const maxTasks = settings.aiMaxGeneratedTasks || 1;
      let results = await BatchAIService.predictBatchPreviousTasks({
        currentTask: currentTask.text,
        relatedTasks,
        settings,
        count: maxTasks,
      });

      // Filter out tasks that already exist in related tasks (including current task)
      const existingTaskTexts = new Set([currentTask.text, ...relatedTasks]);
      results = results.filter(result => !existingTaskTexts.has(result));

      if (results.length === 0) {
        new Notice("AI generated tasks already exist among related tasks. No new tasks created.");
        return;
      }

      // @ts-ignore
      const tasksPlugin = app.plugins.plugins["obsidian-tasks-plugin"];
      if (!tasksPlugin?.apiV1) {
        new Notice("Tasks plugin not found");
        return;
      }
      const tasksApi = tasksPlugin.apiV1;

      // Parse task types (S: sequential, P: parallel)
      const parsedTasks = results.map(result => {
        let type: 'sequential' | 'parallel' = 'parallel';
        let text = result.trim();
        if (text.startsWith('S:')) {
          type = 'sequential';
          text = text.substring(2).trim();
        } else if (text.startsWith('P:')) {
          type = 'parallel';
          text = text.substring(2).trim();
        }
        // Remove any other potential prefixes like numbers, bullets
        text = text.replace(/^[-*•]\s*/, '').replace(/^\d+\.\s*/, '');
        return { text, type };
      });

      // Filter out empty texts
      const validTasks = parsedTasks.filter(task => task.text.length > 0);

      // Create task lines
      const taskLines = validTasks.map(task => `- [ ] ${task.text}`);

      // Track the next task for sequential chain (closest to current task)
      let nextSequentialTask = currentTask;

      for (let i = validTasks.length - 1; i >= 0; i--) {
        const task = validTasks[i];
        const taskLine = taskLines[i];

        // Add to inbox
        await addIsolatedTaskLineToVault(taskLine, settings.taskInbox, app);

        // Create edge based on task type
        const factory = new TaskFactory();
        const rawTask: RawTask = {
          status: "todo",
          text: taskLine,
          link: {
            path: settings.taskInbox,
          },
        };
        const newTask = factory.parse(rawTask, "dataview");

        if (task.type === 'sequential') {
          // Create edge from new task to next sequential task (new task -> next)
          await addLinkSignsBetweenTasks(
            vault,
            newTask,
            nextSequentialTask,
            settings.linkingStyle
          );
          // Update next sequential task to be this new task (moving backward)
          nextSequentialTask = newTask;
        } else {
          // Parallel: create edge from new task to current task
          await addLinkSignsBetweenTasks(
            vault,
            newTask,
            currentTask,
            settings.linkingStyle
          );
        }
      }

      new Notice(`Created ${results.length} previous task(s) successfully!`);

      // Reload tasks to refresh the graph
      setTimeout(() => {
        reloadTasks();
      }, 200);

    } catch (error) {
      console.error("AI previous task prediction failed:", error);
      const message = error instanceof Error ? error.message : String(error);
      new Notice(`Failed to create previous task: ${message}`);
    }
      }, [tasks, settings, app, vault, reloadTasks]);

  const handleCreateTask = useCallback((taskLine: string) => {
    const rawTask: RawTask = {
      status: "todo",
      text: taskLine,
      link: {
        path: settings.taskInbox,
      },
    };
    const factory = new TaskFactory();
    const newTask = factory.parse(rawTask, "dataview");

    skipFitViewRef.current = true;
    setTasks((prev) => [...prev, newTask]);
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
              handleDeleteTask,
        handleAiNext,
        handleAiBefore,
        // Proximity color settings
      settings.dueProximityDays,
      settings.dueProximityColor,
      settings.scheduleProximityDays,
      settings.scheduleProximityColor,
      // Date tooltip settings
      settings.showDateTooltips,
      settings.tooltipMaxWidth,
      settings.tooltipSpacing,
      settings.tooltipFontSize,
      settings.tooltipCapsulePadding,
      settings.tooltipLineHeight,
      settings.tooltipVerticalOffset
    );
    let newEdges = createEdgesFromTasks(
      tasks,
      settings.layoutDirection,
      settings.debugVisualization
    );

    const filteredNodeIds = getFilteredNodeIds(
      tasks,
      selectedTags,
      selectedStatuses,
      excludedTags,
      selectedFiles
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
      // setTimeout(() => {
      //   reactFlowInstance.fitView({ duration: 400 });
      // }, 1000);
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
    handleCreateTask,
  ]);

  const nodeTypes = useMemo(() => ({ task: TaskNode }), []);
  const edgeTypes = useMemo(() => ({ hash: HashEdge }), []);

  // 更新插件中的当前过滤状态
  useEffect(() => {
    if (plugin?.updateCurrentFilterState) {
      plugin.updateCurrentFilterState({
        selectedTags,
        excludedTags,
        selectedStatuses,
        selectedFiles,
        hideTags,
        layoutDirection: settings.layoutDirection,
        showPriorities: settings.showPriorities,
        showTags: settings.showTags,
      });
    }
  }, [
    plugin,
    selectedTags,
    excludedTags,
    selectedStatuses,
    selectedFiles,
    hideTags,
    settings.layoutDirection,
    settings.showPriorities,
    settings.showTags,
  ]);

  const onEdgeClick = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (event: any, edge: any) => {
      event.stopPropagation();
      setSelectedEdge(edge.id);
      // Focus the container so keyboard events work
      if (containerRef.current) {
        containerRef.current.focus();
      }
    },
    [setSelectedEdge]
  );

  const onNodeClick = useCallback(() => {
    setSelectedEdge(null);
  }, [setSelectedEdge]);

  const createTasks = useCallback(async () => {
    // @ts-ignore
    const tasksPlugin = app.plugins.plugins["obsidian-tasks-plugin"];
    if (!tasksPlugin?.apiV1) {
      console.error("Tasks plugin not found or API not available");
      return;
    }
    const tasksApi = tasksPlugin.apiV1;

    let taskLine = await tasksApi.createTaskLineModal();
    if (!taskLine) {
      new Notice("Task creation cancelled.");
      return;
    }

    await addIsolatedTaskLineToVault(taskLine, settings.taskInbox, app);

    const factory = new TaskFactory();
    const rawTask: RawTask = {
      status: "todo",
      text: taskLine,
      link: {
        path: settings.taskInbox,
      },
    };
    const newTask = factory.parse(rawTask, "dataview");

    const tagsToAdd = selectedTags.filter((tag) => tag !== NO_TAGS_VALUE);
    for (const tag of tagsToAdd) {
      await newTask.addTag(tag, app);
    }

    new Notice("New task has been created!");

    setTimeout(() => {
      reloadTasks();
    }, 200);
  }, [
    setSelectedEdge,
    selectedTags,
    app,
    handleDeleteTask,
    reactFlowInstance,
    settings,
    setNodes,
    setTasks,
  ]);

  const onDeleteSelectedEdge = useCallback(async () => {
    if (!selectedEdge) return;

    const edge = edges.find((e) => e.id === selectedEdge);
    if (!edge || !edge.data?.hash) return;

    const sourceTask = tasks.find((t) => t.id === edge.source);
    const targetTask = tasks.find((t) => t.id === edge.target);
    if (!sourceTask || !targetTask) return;

    if (vault) {
      try {
        await removeLinkSignsBetweenTasks(vault, targetTask, sourceTask.id);
        setEdges((eds) => eds.filter((e) => e.id !== selectedEdge));
        setSelectedEdge(null);
        // Reload tasks after a short delay to sync with file changes
        setTimeout(() => {
          reloadTasks();
        }, 200);
      } catch (error) {
        console.error("Failed to delete edge:", error);
        const message = error instanceof Error ? error.message : String(error);
        new Notice(`Failed to delete edge: ${message}`);
      }
    }
  }, [selectedEdge, edges, tasks, vault, setEdges, reloadTasks]);

  const onConnectStart = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (event: any, params: OnConnectStartParams) => {
      connectionStartHandleRef.current = {
        nodeId: params.nodeId,
        handleId: params.handleId,
        handleType: params.handleType,
      };
    },
    []
  );

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

      try {
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
          // Reload tasks after a short delay to sync with file changes
          setTimeout(() => {
            reloadTasks();
          }, 200);
        }
      } catch (error) {
        console.error("Failed to create edge:", error);
        const message = error instanceof Error ? error.message : String(error);
        new Notice(`Failed to create edge: ${message}`);
      }
    },
    [
      vault,
      tasks,
      setEdges,
      settings.layoutDirection,
      settings.debugVisualization,
      settings.linkingStyle,
      reloadTasks,
    ]
  );

  const onConnectEnd = useCallback(
    async (event: MouseEvent | TouchEvent) => {
      // Get mouse position at the end of connection
      let clientX = 0;
      let clientY = 0;

      if (event instanceof MouseEvent) {
        clientX = event.clientX;
        clientY = event.clientY;
      } else if (event instanceof TouchEvent && event.changedTouches.length > 0) {
        clientX = event.changedTouches[0].clientX;
        clientY = event.changedTouches[0].clientY;
      }

      // Convert screen coordinates to flow coordinates
      const flowPosition = reactFlowInstance.screenToFlowPosition({
        x: clientX,
        y: clientY,
      });

      const x = flowPosition.x;
      const y = flowPosition.y;

      // Find node at the drop position
      let targetNode = null;
      let targetHandleType: 'source' | 'target' | null = null;

      // Check all nodes to see if the drop position is within any node
      for (const node of nodes) {
        const nodeRect = {
          x: node.position.x,
          y: node.position.y,
          width: node.width || NODEHEIGHT,
          height: node.height || NODEWIDTH,
        };

        // Check if the drop position is within the node bounds
        if (
          x >= nodeRect.x &&
          x <= nodeRect.x + nodeRect.width &&
          y >= nodeRect.y &&
          y <= nodeRect.y + nodeRect.height
        ) {
          targetNode = node;

          // Determine which half of the node the drop is in
          // For vertical layout: top half -> target (incoming), bottom half -> source (outgoing)
          // For horizontal layout: left half -> target (incoming), right half -> source (outgoing)
          const relativeX = x - nodeRect.x;
          const relativeY = y - nodeRect.y;

          if (settings.layoutDirection === "Vertical") {
            // Vertical layout
            if (relativeY < nodeRect.height / 2) {
              // Top half - connect to target (incoming)
              targetHandleType = 'target';
            } else {
              // Bottom half - connect to source (outgoing)
              targetHandleType = 'source';
            }
          } else {
            // Horizontal layout
            if (relativeX < nodeRect.width / 2) {
              // Left half - connect to target (incoming)
              targetHandleType = 'target';
            } else {
              // Right half - connect to source (outgoing)
              targetHandleType = 'source';
            }
          }
          break;
        }
      }

      const connectionStartHandle = connectionStartHandleRef.current;

      if (targetNode && connectionStartHandle && connectionStartHandle.nodeId) {
        // Connect to existing node
        const {
          nodeId: sourceNodeId,
          handleType: sourceHandleType,
        } = connectionStartHandle;

        // Prevent connecting a node to itself
        if (sourceNodeId === targetNode.id) {
          connectionStartHandleRef.current = null;
          return;
        }

        // Determine connection parameters based on handle types
        let params;
        if (sourceHandleType === 'source' && targetHandleType === 'target') {
          // Normal connection: source -> target
          params = {
            source: sourceNodeId,
            sourceHandle: connectionStartHandle.handleId,
            target: targetNode.id,
            targetHandle: targetHandleType,
          };
        } else if (sourceHandleType === 'target' && targetHandleType === 'source') {
          // Reverse connection: target -> source (should be source -> target)
          params = {
            source: targetNode.id,
            sourceHandle: targetHandleType,
            target: sourceNodeId,
            targetHandle: connectionStartHandle.handleId,
          };
        } else {
          // Invalid combination (source->source or target->target)
          connectionStartHandleRef.current = null;
          return;
        }

        // Trigger the connection
        onConnect(params);
      } else if (!targetNode && connectionStartHandle && connectionStartHandle.nodeId) {
        // Create new node only when dropped on empty space
        const {
          nodeId: sourceNodeId,
          handleType: sourceHandleType,
        } = connectionStartHandle;

        // @ts-ignore
        const tasksPlugin = app.plugins.plugins["obsidian-tasks-plugin"];
        if (!tasksPlugin?.apiV1) {
          console.error("Tasks plugin not found or API not available");
          return;
        }
        const tasksApi = tasksPlugin.apiV1;

        let taskLine = await tasksApi.createTaskLineModal();
        if (!taskLine) {
          new Notice("Task creation cancelled.");
          connectionStartHandleRef.current = null;
          return;
        }

        await addIsolatedTaskLineToVault(taskLine, settings.taskInbox, app);

        const sourceTask = tasks.find((t) => t.id === sourceNodeId);
        if (!sourceTask) {
          new Notice("Source task not found for linking.");
          connectionStartHandleRef.current = null;
          return;
        }

        const factory = new TaskFactory();
        const rawTask: RawTask = {
          status: "todo",
          text: taskLine,
          link: {
            path: settings.taskInbox,
          },
        };
        const newTask = factory.parse(rawTask, "dataview");

        const tagsToAdd = selectedTags.filter((tag) => tag !== NO_TAGS_VALUE);
        for (const tag of tagsToAdd) {
          await newTask.addTag(tag, app);
        }

        if (sourceHandleType === "source") {
          await addLinkSignsBetweenTasks(
            vault,
            sourceTask,
            newTask,
            settings.linkingStyle
          );
        } else if (sourceHandleType === "target") {
          await addLinkSignsBetweenTasks(
            vault,
            newTask,
            sourceTask,
            settings.linkingStyle
          );
        } else {
          new Notice("Unknown handle type. Cannot create link.");
          connectionStartHandleRef.current = null;
          return;
        }

        new Notice("New task has been created!");

        setTimeout(()=>{reloadTasks();}, 200);
      }
      connectionStartHandleRef.current = null;
    },
    [
      reactFlowInstance,
      app,
      settings,
      selectedTags,
      setTasks,
      setNodes,
      handleDeleteTask,
      onConnect,
      tasks,
      containerRef,
      nodes,
      vault,
      reloadTasks,
    ]
  );

  // Handle keyboard events for deleting selected edge
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (selectedEdge) {
          event.preventDefault();
          event.stopPropagation();
          onDeleteSelectedEdge();
          return;
        }
      }
    };

    // Add event listener with capture phase to ensure we catch the event early
    window.addEventListener('keydown', handleKeyDown, { capture: true });

    // Also attach to container element to ensure we catch events when container is focused
    const container = containerRef.current;
    if (container) {
      container.addEventListener('keydown', handleKeyDown, { capture: true });
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      if (container) {
        container.removeEventListener('keydown', handleKeyDown, { capture: true });
      }
    };
  }, [selectedEdge, onDeleteSelectedEdge]);

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
      <div
        className="tasks-map-graph-container"
        ref={containerRef}
        tabIndex={-1}
        onKeyDown={(e) => {
          if ((e.key === 'Delete' || e.key === 'Backspace') && selectedEdge) {
            e.preventDefault();
            e.stopPropagation();
            onDeleteSelectedEdge();
          }
        }}
      >
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
          onConnectStart={onConnectStart}
          onConnectEnd={onConnectEnd}
          onKeyDown={(event) => {
            if ((event.key === 'Delete' || event.key === 'Backspace') && selectedEdge) {
              event.preventDefault();
              event.stopPropagation();
              onDeleteSelectedEdge();
            }
          }}
        >
          <GuiOverlay
            allTags={allTags}
            selectedTags={selectedTags}
            setSelectedTags={setSelectedTags}
            excludedTags={excludedTags}
            setExcludedTags={setExcludedTags}
            allFiles={allFiles}
            selectedFiles={selectedFiles}
            setSelectedFiles={setSelectedFiles}
            createTasks={createTasks}
            reloadTasks={reloadTasks}
            allStatuses={ALL_STATUSES}
            selectedStatuses={selectedStatuses}
            setSelectedStatuses={setSelectedStatuses}
            showTags={settings.showTags}
            hideTags={hideTags}
            setHideTags={toggleHideTags}
            layoutDirection={settings.layoutDirection}
            showPriorities={settings.showPriorities}
            showTagsSetting={settings.showTags}
          />
          <TaskMinimap />
          <Background />
        </ReactFlow>
        {selectedEdge && <DeleteEdgeButton onDelete={onDeleteSelectedEdge} />}
      </div>
    </TagsContext.Provider>
  );
}
