import React from "react";

interface LinkButtonProps {
	title: string;
	onClick: (e: React.MouseEvent) => void;
	status?: "success" | "error" | "normal";
}

export function LinkButton({
	title,
	onClick,
	status = "normal",
}: LinkButtonProps) {
	return (
		<button
			title={title}
			onClick={onClick}
			style={{
				position: "absolute",
				bottom: 0,
				right: 0,
				background: "none",
				border: "none",
				padding: 4,
				cursor: "pointer",
				color:
					status === "success"
						? "var(--text-success)"
						: status === "error"
						? "var(--text-error)"
						: "var(--text-normal)",
			}}
		>
			<svg
				width="20"
				height="20"
				viewBox="0 0 20 20"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					d="M7 13L13 7M13 7H8M13 7V12"
					stroke="currentColor"
					strokeWidth="1.5"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</svg>
		</button>
	);
}
