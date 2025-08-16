import { EdgeProps, getBezierPath, Position } from "reactflow";

export default function HashEdge({
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
