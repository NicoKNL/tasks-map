interface DeleteEdgeButtonProps {
	onDelete: () => void;
}

export const DeleteEdgeButton = ({ onDelete }: DeleteEdgeButtonProps) => {
	return (
		<div className="delete-edge-button-container">
			<button onClick={onDelete} className="delete-edge-button">
				Delete edge
			</button>
		</div>
	);
};
