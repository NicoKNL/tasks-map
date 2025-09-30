import React from "react";

interface TagProps {
	tag: string;
}

export function Tag({ tag }: TagProps) {
	return <span className="tasks-map-tag">#{tag}</span>;
}
