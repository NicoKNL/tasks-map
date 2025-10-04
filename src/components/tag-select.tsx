import Select, { MultiValue } from "react-select";

interface TagSelectProps {
  allTags: string[];
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void;
}

type TagOption = { value: string; label: string };

export default function TagSelect({
  allTags,
  selectedTags,
  setSelectedTags,
}: TagSelectProps) {
  return (
    <Select
      isMulti
      options={allTags.map((tag) => ({ value: tag, label: tag }))}
      value={selectedTags.map((tag) => ({ value: tag, label: tag }))}
      onChange={(opts: MultiValue<TagOption>) =>
        setSelectedTags(opts.map((o) => o.value))
      }
      placeholder="Filter by tags..."
      styles={{
        menu: (base) => ({
          ...base,
          zIndex: 9999,
          background: "var(--background-secondary)",
          color: "var(--text-normal)",
          border: "1px solid var(--background-modifier-border)",
        }),
        control: (base, state) => ({
          ...base,
          background: "var(--background-primary)",
          color: "var(--text-normal)",
          borderColor: "var(--background-modifier-border)",
          boxShadow: state.isFocused
            ? "0 0 0 1px var(--interactive-accent)"
            : base.boxShadow,
          "&:hover": {
            borderColor: "var(--interactive-accent)",
          },
        }),
        option: (base, state) => ({
          ...base,
          background: state.isFocused
            ? "var(--background-modifier-hover)"
            : "var(--background-secondary)",
          color: "var(--text-normal)",
        }),
        multiValue: (base) => ({
          ...base,
          background: "var(--background-modifier-active)",
          color: "var(--text-normal)",
        }),
        multiValueLabel: (base) => ({
          ...base,
          color: "var(--text-normal)",
        }),
        multiValueRemove: (base) => ({
          ...base,
          color: "var(--text-faint)",
          ":hover": {
            background: "var(--background-modifier-hover)",
            color: "var(--text-normal)",
          },
        }),
        placeholder: (base) => ({
          ...base,
          color: "var(--text-faint)",
        }),
        input: (base) => ({
          ...base,
          color: "var(--text-normal)",
        }),
      }}
    />
  );
}
