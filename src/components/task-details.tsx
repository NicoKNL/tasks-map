import { BaseTask, TaskStatus } from "src/types/task";

interface TaskDetailsProps {
  task: BaseTask;
  status: TaskStatus;
}

export function TaskDetails({ task, status }: TaskDetailsProps) {
  return (
    <div className="task-details">
      <div>
        <b>ID:</b> {task.id}
      </div>
      <div>
        <b>Status:</b>{" "}
        {status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ")}
      </div>
      <div>
        <b>Summary:</b> {task.summary}
      </div>
      <div>
        <b>Tags:</b> {task.tags.join(", ")}
      </div>
      <div>
        <b>Priority:</b> {task.priority}
      </div>
      <div>
        <b>Link:</b> {task.link}
      </div>
      <div>
        <b>Incoming links:</b> {task.incomingLinks?.join(", ") || "-"}
      </div>
    </div>
  );
}
