import React from "react";

interface ExpandButtonProps {
	expanded: boolean;
	onClick: (e: React.MouseEvent) => void;
}

export function ExpandButton({ expanded, onClick }: ExpandButtonProps) {
	return (
		<button
			onClick={onClick}
			title={expanded ? "Collapse" : "Expand"}
			className="tasks-map-expand-button"
		>
			<svg
				width="20"
				height="20"
				viewBox="0 0 20 20"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				aria-hidden="true"
			>
				<polyline
					points={expanded ? "6 12 10 8 14 12" : "6 8 10 12 14 8"}
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
					fill="none"
				/>
			</svg>
		</button>
	);
}
