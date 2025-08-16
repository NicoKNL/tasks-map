import React from "react";

interface TagProps {
	tag: string;
	style?: React.CSSProperties;
}

export function Tag({ tag, style }: TagProps) {
	return (
		<span className="tag" style={style}>
			#{tag}
		</span>
	);
}
