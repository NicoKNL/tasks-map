import React from "react";
import { NodeProps, NodeResizer } from "reactflow";
import { FolderOpen } from "lucide-react";

export interface ProjectGroupNodeData {
  label: string;
  isDragOver?: boolean;
}

export default function ProjectGroupNode({
  data,
  selected,
}: NodeProps<ProjectGroupNodeData>) {
  const classes = [
    "tasks-map-project-group",
    selected ? "tasks-map-project-group--selected" : "",
    data.isDragOver ? "tasks-map-project-group--drag-over" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={classes}>
      <NodeResizer minWidth={100} minHeight={100} isVisible={selected} />
      <div className="tasks-map-project-group-label">
        <FolderOpen size={13} />
        <span>{data.label}</span>
      </div>
    </div>
  );
}
