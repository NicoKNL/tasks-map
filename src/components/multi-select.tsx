import Select, { MultiValue } from "react-select";
import { t } from "../i18n";

interface MultiSelectProps<T extends string> {
  options: T[];
  selected: T[];
  setSelected: (selected: T[]) => void; // eslint-disable-line no-unused-vars
  placeholder?: string;
}

type OptionType = { value: string; label: string };

export default function MultiSelect<T extends string>({
  options,
  selected,
  setSelected,
  placeholder = t("multiselect.select"),
}: MultiSelectProps<T>) {
  return (
    <Select
      isMulti
      options={options.map((o) => ({ value: o, label: o }))}
      value={selected.map((o) => ({ value: o, label: o }))}
      onChange={(opts: MultiValue<OptionType>) =>
        setSelected(opts.map((o) => o.value as T))
      }
      placeholder={placeholder}
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
