import React from "react";
import { App } from "obsidian";

interface LinkButtonProps {
	title?: string;
	taskStatus?: "todo" | "done" | "canceled" | "in_progress";
	link: string;
	app: App;
}

export const LinkButton = ({
	title,
	link,
	app,
	taskStatus = "todo",
}: LinkButtonProps) => {
	const status =
		taskStatus === "done"
			? "success"
			: taskStatus === "canceled"
			? "error"
			: "normal";
	const handleClick = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		app.workspace.openLinkText(link, link);
	};

	return (
		<button
			className={`link-button link-button--${status}`}
			onClick={handleClick}
			style={{
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				padding: 4,
				position: "absolute",
				bottom: 8,
				right: 8,
				border: "none",
				background: "transparent",
				cursor: "pointer",
				width: 28,
				height: 28,
			}}
		>
			<svg
				width="16"
				height="16"
				viewBox="0 0 16 16"
				fill="none"
				style={{ display: "block" }}
			>
				<path
					d="M5 3H13V11M13 3L3 13"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</svg>
		</button>
	);
};
