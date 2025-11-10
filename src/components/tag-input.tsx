import React, { useRef, useEffect } from "react";
import CreatableSelect from "react-select/creatable";

interface TagInputProps {
  allTags: string[];
  existingTags: string[]; // Tags already on this task
  onAddTag: (tag: string) => void; // eslint-disable-line no-unused-vars
  onCancel: () => void;
  hasError?: boolean;
}

type TagOption = { value: string; label: string };

export function TagInput({
  allTags,
  existingTags,
  onAddTag,
  onCancel,
  hasError = false,
}: TagInputProps) {
  const selectRef = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const hasSelectedRef = useRef(false);
  const [inputValue, setInputValue] = React.useState("");
  const [hasSpaceError, setHasSpaceError] = React.useState(false);

  useEffect(() => {
    // Focus the input when component mounts
    if (selectRef.current) {
      selectRef.current.focus();
    }
  }, []);

  // Filter out tags that are already on the task
  // Tags in allTags are sorted by frequency (most used first) from TaskMapGraphView
  const availableTags = allTags.filter((tag) => !existingTags.includes(tag));

  const options: TagOption[] = availableTags.map((tag) => ({
    value: tag,
    label: tag,
  }));

  const handleChange = (newValue: TagOption | null) => {
    hasSelectedRef.current = true;
    if (newValue) {
      onAddTag(newValue.value);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onCancel();
    }
    // Don't handle Enter here - let react-select handle it
    // This allows selecting from suggestions with Enter
  };

  const handleMenuClose = () => {
    if (!hasSelectedRef.current) {
      onCancel();
    }
  };

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    // Check if input contains any spaces (whitespace)
    setHasSpaceError(newValue.includes(" "));
  };

  const handleCreateOption = (inputValue: string) => {
    hasSelectedRef.current = true;
    onAddTag(inputValue);
  };

  return (
    <CreatableSelect
      ref={selectRef}
      classNamePrefix="tasks-map-tag-select"
      className={hasError || hasSpaceError ? "tasks-map-tag-select-error" : ""}
      options={options}
      inputValue={inputValue}
      onInputChange={handleInputChange}
      onChange={handleChange}
      onCreateOption={handleCreateOption}
      onKeyDown={handleKeyDown}
      onMenuClose={handleMenuClose}
      placeholder="Type or select tag..."
      autoFocus={true}
      openMenuOnFocus={true}
      formatCreateLabel={(inputValue) => `Create tag "${inputValue}"`}
      components={{
        DropdownIndicator: () => null,
        IndicatorSeparator: () => null,
      }}
    />
  );
}
