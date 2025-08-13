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
			style={{
				position: "absolute",
				bottom: -16,
				left: "50%",
				transform: "translateX(-50%)",
				width: 28,
				height: 28,
				borderRadius: "50%",
				background: "var(--background-modifier-hover)",
				border: "1px solid var(--background-modifier-border)",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				boxShadow: "0 1px 4px rgba(var(--color-black-rgb),0.08)",
				zIndex: 2,
				cursor: "pointer",
			}}
		></button>
	);
}
