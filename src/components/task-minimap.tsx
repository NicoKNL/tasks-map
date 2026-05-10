import { MiniMap } from "reactflow";

export const TaskMinimap = () => {
  // TODO: Would be nice to have better typing for node here
  const getNodeColor = (node: { data?: { task?: { status?: string } } }) => {
    const status = node.data?.task?.status;
    switch (status) {
      case "done":
        return "var(--tasks-map-color-green)";
      case "in_progress":
        return "var(--tasks-map-color-blue)";
      case "canceled":
        return "var(--tasks-map-color-red)";
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
