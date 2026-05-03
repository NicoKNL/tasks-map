import React from "react";
import { NodeProps, NodeResizer } from "reactflow";
import { FolderOpen } from "lucide-react";

export interface ProjectGroupNodeData {
  label: string;
}

export default function ProjectGroupNode({
  data,
  selected,
}: NodeProps<ProjectGroupNodeData>) {
  return (
    <div className={`tasks-map-project-group${selected ? " selected" : ""}`}>
      <NodeResizer minWidth={100} minHeight={100} isVisible={selected} />
      <div className="tasks-map-project-group-label">
        <FolderOpen size={13} />
        <span>{data.label}</span>
      </div>
    </div>
  );
}
