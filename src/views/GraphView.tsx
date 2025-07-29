import { ItemView, WorkspaceLeaf } from "obsidian";
import React from "react";
import { useEffect } from "react";
import { createRoot, Root } from "react-dom/client";
import ReactFlow, {
	Background,
	Position,
	useNodesState,
	useEdgesState,
	addEdge,
	useReactFlow,
	ReactFlowProvider,
	MiniMap,
	EdgeProps,
	getBezierPath,
} from "reactflow";
import { AppContext } from "src/contexts/context";
import { useApp } from "src/hooks/hooks";
import "reactflow/dist/style.css";
import {
	addLinkSignsBetweenTasks,
	getAllDataviewTasks,
	getLayoutedElements,
	removeLinkSignsBetweenTasks,
} from "src/lib/utils";
import { Task } from "src/types/task";
import GuiOverlay from "src/components/gui-overlay";
import TaskNode from "src/components/task-node";
import { create } from "domain";

export const VIEW_TYPE = "task-map-graph-view";

export default class TaskMapGraphView extends ItemView {
	root: Root | null = null;

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType() {
		return VIEW_TYPE;
	}

	getDisplayText() {
		return "Tasks Map";
	}

	async onOpen() {
		function TaskFlowView() {
			const app = useApp();
			const vault = app?.vault;
			const [nodes, setNodes, onNodesChange] = useNodesState([]);
			const [edges, setEdges, onEdgesChange] = useEdgesState([]);
			const [tasks, setTasks] = React.useState<Task[]>([]);
			const [selectedTags, setSelectedTags] = React.useState<string[]>(
				[]
			);
			const [selectedEdge, setSelectedEdge] = React.useState<
				string | null
			>(null);
			const selectedEdgeRef = React.useRef<string | null>(null);
			const edgesRef = React.useRef(edges);
			const tasksRef = React.useRef(tasks);
			const vaultRef = React.useRef(vault);
			const reactFlowInstance = useReactFlow();

			useEffect(() => {
				selectedEdgeRef.current = selectedEdge;
			}, [selectedEdge]);

			useEffect(() => {
				edgesRef.current = edges;
			}, [edges]);

			useEffect(() => {
				tasksRef.current = tasks;
			}, [tasks]);

			useEffect(() => {
				vaultRef.current = vault;
			}, [vault]);

			const allTags = React.useMemo(() => {
				const tagSet = new Set<string>();
				tasks.forEach((task) =>
					task.tags.forEach((tag) => tagSet.add(tag))
				);
				return Array.from(tagSet).sort();
			}, [tasks]);

			const getFilteredNodeIds = (
				tasks: Task[],
				nodes: any[],
				selectedTags: string[]
			) => {
				if (selectedTags.length === 0) return nodes.map((n) => n.id);
				return tasks
					.filter((task) =>
						selectedTags.some((tag) => task.tags.includes(tag))
					)
					.map((task) => task.id);
			};

			const reloadTasks = () => {
				const newTasks = getAllDataviewTasks(app!);
				setTasks(newTasks);
			};

			function createNodesFromTasks(tasks: Task[]) {
				return tasks.map((task, idx) => ({
					id: task.id,
					position: { x: 0, y: idx * 80 },
					data: { task },
					type: "task",
					sourcePosition: Position.Right,
					targetPosition: Position.Left,
					draggable: true,
				}));
			}

			function createEdgesFromTasks(tasks: Task[]) {
				let edges: any[] = [];
				tasks.forEach((task) => {
					task.incomingLinks.forEach((parentTaskId) => {
						edges.push({
							id: `${parentTaskId}-${task.id}`,
							source: parentTaskId,
							target: task.id,
							animated: true,
							type: "hash",
							data: { hash: `${parentTaskId}-${task.id}` },
						});
					});
				});
				return edges;
			}

			useEffect(() => {
				let newNodes = createNodesFromTasks(tasks);
				let newEdges = createEdgesFromTasks(tasks);

				if (selectedTags.length > 0) {
					const filteredNodeIds = getFilteredNodeIds(
						tasks,
						newNodes,
						selectedTags
					);
					newNodes = newNodes.filter((n) =>
						filteredNodeIds.includes(n.id)
					);
					newEdges = newEdges.filter(
						(e) =>
							filteredNodeIds.includes(e.source) &&
							filteredNodeIds.includes(e.target)
					);
				}
				const layoutedNodes = getLayoutedElements(newNodes, newEdges);
				setNodes(layoutedNodes);
				setEdges(newEdges);

				setTimeout(() => {
					try {
						reactFlowInstance.fitView({ duration: 400 });
					} catch {}
				}, 50);
			}, [tasks, selectedTags]);

			const nodeTypes = React.useMemo(() => ({ task: TaskNode }), []);
			const edgeTypes = React.useMemo(() => ({ hash: HashEdge }), []);

			function HashEdge({
				id,
				data,
				sourceX,
				sourceY,
				targetX,
				targetY,
				markerEnd,
				style,
			}: EdgeProps) {
				const [edgePath, labelX, labelY] = getBezierPath({
					sourceX,
					sourceY,
					targetX,
					targetY,
					sourcePosition: Position.Right,
					targetPosition: Position.Left,
				});
				return (
					<g>
						{/* Invisible thick path for easier selection */}
						<path
							className="react-flow__edge-interaction"
							d={edgePath}
							stroke="transparent"
							strokeWidth={16}
							fill="none"
							style={{ cursor: "pointer" }}
						/>
						<path
							id={id}
							style={style}
							className="react-flow__edge-path"
							d={edgePath}
							markerEnd={markerEnd}
						/>
						<text
							x={labelX}
							y={labelY - 8}
							textAnchor="middle"
							fontSize={12}
							fill="#888"
							style={{
								userSelect: "none",
								pointerEvents: "none",
							}}
						>
							{data?.hash}
						</text>
					</g>
				);
			}

			const onEdgeClick = React.useCallback(
				(event: any, edge: any) => {
					event.stopPropagation();
					setSelectedEdge(edge.id);
				},
				[setSelectedEdge]
			);

			const onNodeClick = React.useCallback(() => {
				setSelectedEdge(null);
			}, [setSelectedEdge]);

			const onPaneClick = React.useCallback(() => {
				setSelectedEdge(null);
			}, [setSelectedEdge]);

			const onDeleteSelectedEdge = React.useCallback(async () => {
				if (!selectedEdge) return;

				const edge = edges.find((e) => e.id === selectedEdge);
				if (!edge || !edge.data?.hash) return;

				const sourceTask = tasks.find((t) => t.id === edge.source);
				const targetTask = tasks.find((t) => t.id === edge.target);
				if (!sourceTask || !targetTask) return;

				if (vault) {
					await removeLinkSignsBetweenTasks(
						vault,
						targetTask,
						sourceTask.id
					);
					setEdges((eds) => eds.filter((e) => e.id !== selectedEdge));
					setSelectedEdge(null);
				}
			}, [selectedEdge, edges, tasks, vault, setEdges, reloadTasks]);

			return (
				<div style={{ width: "100%", height: "100%" }}>
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
						onConnect={async (params) => {
							const sourceTask = tasks.find(
								(t) => t.id === params.source
							);
							const targetTask = tasks.find(
								(t) => t.id === params.target
							);

							if (vault && sourceTask && targetTask) {
								const hash = await addLinkSignsBetweenTasks(
									vault,
									sourceTask,
									targetTask
								);
								if (hash) {
									setEdges((eds) =>
										addEdge(
											{
												...params,
												animated: true,
												type: "hash",
												data: { hash: hash },
											},
											eds
										)
									);
								}
							}
						}}
						onEdgeClick={onEdgeClick}
						onNodeClick={onNodeClick}
						onPaneClick={onPaneClick}
					>
						<GuiOverlay
							allTags={allTags}
							selectedTags={selectedTags}
							setSelectedTags={setSelectedTags}
							reloadTasks={reloadTasks}
						/>
						<MiniMap
							nodeColor={(n) =>
								n.data?.task?.completed
									? "var(--task-completed-green)"
									: "var(--background-secondary)"
							}
							nodeStrokeWidth={2}
							pannable
							zoomable
							style={{
								background: "var(--background-primary)",
								borderRadius: 8,
								boxShadow:
									"0 2px 8px rgba(var(--color-black), 0.12)",
							}}
						/>
						<Background />
					</ReactFlow>
					{selectedEdge && (
						<div
							style={{
								position: "fixed",
								bottom: 100,
								left: "50%",
								transform: "translateX(-50%)",
								zIndex: 100,
							}}
						>
							<button
								onClick={onDeleteSelectedEdge}
								style={{
									padding: 10,
									background: "var(--color-red)",
									color: "var(--color-white)",
									border: "none",
									borderRadius: 6,
									fontWeight: 600,
								}}
							>
								Delete Edge
							</button>
						</div>
					)}
				</div>
			);
		}

		this.root = createRoot(this.containerEl.children[1]);
		this.root.render(
			<AppContext.Provider value={this.app}>
				<ReactFlowProvider>
					<TaskFlowView />
				</ReactFlowProvider>
			</AppContext.Provider>
		);
	}

	async onClose() {
		this.root?.unmount();
	}
}
