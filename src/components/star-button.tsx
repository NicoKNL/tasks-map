import { Star } from "lucide-react";

interface StarButtonProps {
  starred: boolean;
  onClick: () => void;
}

export function StarButton({ starred, onClick }: StarButtonProps) {
  return (
    <span
      className="tasks-map-star-button"
      onClick={onClick}
      title={starred ? "Remove star" : "Add star"}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onClick();
        }
      }}
    >
      <Star size={16} fill={starred ? "currentColor" : "none"} />
    </span>
  );
}
