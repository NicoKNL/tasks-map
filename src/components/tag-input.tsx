import React, { useRef, useEffect } from "react";
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
  const selectRef = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const hasSelectedRef = useRef(false);

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
    hasSelectedRef.current = true;
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
    }
    // Don't handle Enter here - let react-select handle it
    // This allows selecting from suggestions with Enter
  };

  const handleMenuClose = () => {
    if (!hasSelectedRef.current) {
      onCancel();
    }
  };

  const handleCreateOption = (inputValue: string) => {
    hasSelectedRef.current = true;
    const cleanTag = cleanTagInput(inputValue);
    if (cleanTag) {
      onAddTag(cleanTag);
    }
  };

  return (
    <CreatableSelect
      ref={selectRef}
      classNamePrefix="tasks-map-tag-select"
      options={options}
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
