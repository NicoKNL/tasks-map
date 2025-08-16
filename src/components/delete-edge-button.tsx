interface DeleteEdgeButtonProps {
	onDelete: () => void;
}

export const DeleteEdgeButton = ({ onDelete }: DeleteEdgeButtonProps) => {
	return (
		<div
			style={{
				position: "fixed",
				bottom: 100,
				left: "50%",
				transform: "translateX(-50%)",
				zIndex: 100,
			}}
		>
			<button
				onClick={onDelete}
				style={{
					padding: 10,
					background: "var(--color-red)",
					color: "var(--color-white)",
					border: "none",
					borderRadius: 6,
					fontWeight: 600,
					cursor: "pointer",
				}}
			>
				Delete Edge
			</button>
		</div>
	);
};
