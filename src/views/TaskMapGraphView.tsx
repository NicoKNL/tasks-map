import React, { useEffect, useCallback, useMemo } from "react";
import ReactFlow, {
	Background,
	useNodesState,
	useEdgesState,
	addEdge,
	useReactFlow,
} from "reactflow";
import { useApp } from "src/hooks/hooks";
import "reactflow/dist/style.css";
import {
	addLinkSignsBetweenTasks,
	getAllDataviewTasks,
	getLayoutedElements,
	removeLinkSignsBetweenTasks,
	createNodesFromTasks,
	createEdgesFromTasks,
} from "src/lib/utils";
import { Task } from "src/types/task";
import GuiOverlay from "src/components/gui-overlay";
import TaskNode from "src/components/task-node";
import { TaskMinimap } from "src/components/task-minimap";
import HashEdge from "src/components/hash-edge";

export default function TaskMapGraphView() {
	const app = useApp();
	const vault = app.vault;
	const [nodes, setNodes, onNodesChange] = useNodesState([]);
	const [edges, setEdges, onEdgesChange] = useEdgesState([]);
	const [tasks, setTasks] = React.useState<Task[]>([]);
	const [selectedTags, setSelectedTags] = React.useState<string[]>([]);
	const [selectedEdge, setSelectedEdge] = React.useState<string | null>(null);
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

	const allTags = useMemo(() => {
		const tagSet = new Set<string>();
		tasks.forEach((task) => task.tags.forEach((tag) => tagSet.add(tag)));
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
		const newTasks = getAllDataviewTasks(app);
		setTasks(newTasks);
	};

	useEffect(() => {
		let newNodes = createNodesFromTasks(tasks);
		let newEdges = createEdgesFromTasks(tasks);

		if (selectedTags.length > 0) {
			const filteredNodeIds = getFilteredNodeIds(
				tasks,
				newNodes,
				selectedTags
			);
			newNodes = newNodes.filter((n) => filteredNodeIds.includes(n.id));
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
			reactFlowInstance.fitView({ duration: 400 });
		}, 50);
	}, [tasks, selectedTags]);

	const nodeTypes = useMemo(() => ({ task: TaskNode }), []);
	const edgeTypes = useMemo(() => ({ hash: HashEdge }), []);

	const onEdgeClick = useCallback(
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
		async (params: any) => {
			const sourceTask = tasks.find((t) => t.id === params.source);
			const targetTask = tasks.find((t) => t.id === params.target);

			if (!vault || !sourceTask || !targetTask) return;

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
							type: "hash",
							data: { hash },
						},
						eds
					)
				);
			}
		},
		[vault, tasks, setEdges]
	);

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
				/>
				<TaskMinimap />
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
