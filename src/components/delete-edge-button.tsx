interface DeleteEdgeButtonProps {
  onDelete: () => void;
}

export const DeleteEdgeButton = ({ onDelete }: DeleteEdgeButtonProps) => {
  return (
    <div className="tasks-map-delete-edge-button-container">
      <button onClick={onDelete} className="tasks-map-delete-edge-button">
        Delete edge
      </button>
    </div>
  );
};
