import React, { useState, useRef, useEffect } from "react";
import CreatableSelect from "react-select/creatable";

interface TagInputProps {
  allTags: string[];
  existingTags: string[]; // Tags already on this task
  onAddTag: (tag: string) => void; // eslint-disable-line no-unused-vars
  onCancel: () => void;
}

type TagOption = { value: string; label: string };

export function TagInput({
  allTags,
  existingTags,
  onAddTag,
  onCancel,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const selectRef = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any

  useEffect(() => {
    // Focus the input when component mounts
    if (selectRef.current) {
      selectRef.current.focus();
    }
  }, []);

  // Helper function to clean tag input (remove leading # and trim whitespace)
  const cleanTagInput = (input: string): string => {
    return input.trim().replace(/^#+/, "");
  };

  // Filter out tags that are already on the task
  // Tags in allTags are sorted by frequency (most used first) from TaskMapGraphView
  const availableTags = allTags.filter((tag) => !existingTags.includes(tag));

  const options: TagOption[] = availableTags.map((tag) => ({
    value: tag,
    label: tag,
  }));

  const handleChange = (newValue: TagOption | null) => {
    if (newValue) {
      const cleanTag = cleanTagInput(newValue.value);
      if (cleanTag) {
        onAddTag(cleanTag);
      }
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onCancel();
    } else if (event.key === "Enter") {
      const cleanTag = cleanTagInput(inputValue);
      if (cleanTag) {
        event.preventDefault();
        onAddTag(cleanTag);
      }
    }
  };

  const handleBlur = () => {
    // If there's input value, add it as a tag
    const cleanTag = cleanTagInput(inputValue);
    if (cleanTag) {
      onAddTag(cleanTag);
      return;
    }
    onCancel();
  };

  return (
    <CreatableSelect
      ref={selectRef}
      options={options}
      value={null}
      inputValue={inputValue}
      onInputChange={(newValue) => setInputValue(newValue)}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      placeholder="Type or select tag..."
      isClearable={false}
      menuIsOpen={true}
      autoFocus={true}
      openMenuOnFocus={true}
      openMenuOnClick={true}
      closeMenuOnSelect={true}
      formatCreateLabel={(inputValue) => `Create tag "${inputValue}"`}
      noOptionsMessage={() => "Type to create a new tag"}
      components={{
        DropdownIndicator: () => null,
        IndicatorSeparator: () => null,
      }}
      styles={{
        container: (base) => ({
          ...base,
          minWidth: "120px",
          fontSize: "12px",
        }),
        control: (base) => ({
          ...base,
          minHeight: "24px",
          height: "24px",
          background: "var(--background-primary)",
          color: "var(--text-normal)",
          borderColor: "var(--interactive-accent)",
          borderRadius: "12px",
          boxShadow: "0 0 0 1px var(--interactive-accent)",
          "&:hover": {
            borderColor: "var(--interactive-accent)",
          },
        }),
        valueContainer: (base) => ({
          ...base,
          padding: "0 8px",
          height: "22px",
        }),
        input: (base) => ({
          ...base,
          margin: "0",
          padding: "0",
          color: "var(--text-normal)",
        }),
        menu: (base) => ({
          ...base,
          zIndex: 9999,
          background: "var(--background-secondary)",
          color: "var(--text-normal)",
          border: "1px solid var(--background-modifier-border)",
          borderRadius: "8px",
          marginTop: "4px",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        }),
        menuList: (base) => ({
          ...base,
          padding: "4px",
          maxHeight: "200px",
        }),
        option: (base, state) => ({
          ...base,
          background: state.isFocused
            ? "var(--background-modifier-hover)"
            : "var(--background-secondary)",
          color: "var(--text-normal)",
          cursor: "pointer",
          borderRadius: "4px",
          padding: "6px 8px",
          fontSize: "12px",
          "&:active": {
            background: "var(--background-modifier-active)",
          },
        }),
        placeholder: (base) => ({
          ...base,
          color: "var(--text-faint)",
          fontSize: "12px",
        }),
        noOptionsMessage: (base) => ({
          ...base,
          color: "var(--text-muted)",
          fontSize: "12px",
        }),
      }}
    />
  );
}
