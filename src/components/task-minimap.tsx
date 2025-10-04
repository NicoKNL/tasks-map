import { MiniMap } from "reactflow";

export const TaskMinimap = () => {
  const getNodeColor = (node: any) => {
    const status = node.data?.task?.status;
    switch (status) {
      case "done":
        return "var(--tasks-map-task-completed-green)";
      case "in_progress":
        return "var(--tasks-map-task-in-progress-blue)";
      case "canceled":
        return "var(--tasks-map-task-canceled-red)";
      default:
        return "var(--background-secondary)";
    }
  };

  return (
    <MiniMap
      className="tasks-map-react-flow__minimap"
      nodeColor={getNodeColor}
      pannable
      zoomable
    />
  );
};
