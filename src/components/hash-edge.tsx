import { EdgeProps, getBezierPath, Position } from "reactflow";

export default function HashEdge({
  id,
  data,
  sourceX,
  sourceY,
  targetX,
  targetY,
  markerEnd,
}: EdgeProps) {
  // Set positions based on layout direction
  const layoutDirection = data?.layoutDirection || "Horizontal";
  const isVertical = layoutDirection === "Vertical";
  const sourcePosition = isVertical ? Position.Bottom : Position.Right;
  const targetPosition = isVertical ? Position.Top : Position.Left;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  return (
    <g>
      {/* Invisible thick path for easier selection */}
      <path
        className="react-flow__edge-interaction tasks-map-hash-edge-interaction"
        d={edgePath}
        stroke="transparent"
        strokeWidth={16}
        fill="none"
      />
      <path
        id={id}
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
        className="tasks-map-hash-edge-text"
      >
        {data?.hash}
      </text>
    </g>
  );
}
