import { t } from "../i18n";

interface DeleteEdgeButtonProps {
  onDelete: () => void;
  onInsertTask: () => void;
}

export const DeleteEdgeButton = ({
  onDelete,
  onInsertTask,
}: DeleteEdgeButtonProps) => {
  return (
    <div className="tasks-map-delete-edge-button-container">
      <button onClick={onDelete} className="tasks-map-delete-edge-button">
        {t("edge_actions.delete_edge")}
      </button>
      <button onClick={onInsertTask} className="tasks-map-insert-task-button">
        {t("edge_actions.insert_task")}
      </button>
    </div>
  );
};
