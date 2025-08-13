import React from "react";

interface TagProps {
	tag: string;
	style?: React.CSSProperties;
}

export function Tag({ tag, style }: TagProps) {
	return (
		<span
			style={{
				display: "inline-block",
				fontSize: 12,
				marginRight: 6,
				color: "var(--text-muted)",
				padding: "2px 6px",
				borderRadius: "var(--radius-xs)",
				...style,
			}}
		>
			#{tag}
		</span>
	);
}
